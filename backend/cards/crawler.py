"""
クローラー: pokemoncard.co.kr から拡張パック情報を取得してDBに保存する

実行方法:
  cd backend
  source venv/bin/activate

  # ステップ1: 一覧ページから名前・画像を取得（高速・約5秒）
  python manage.py shell -c "from cards.crawler import run_listing; run_listing()"

  # ステップ2: サブページをスキャンして価格を補完（低速・約3分）
  python manage.py shell -c "from cards.crawler import run_price_scan; run_price_scan()"
"""

import re
import time
import requests
from bs4 import BeautifulSoup
from django.db import transaction

BASE_URL = 'https://pokemoncard.co.kr'
LISTING_URL = f'{BASE_URL}/card/category/info1'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

# 닌자스피너(887)〜바이올렛ex のIDスキャン範囲
# 경험칙上、바이올렛exは2023年頃のリリースなのでID450前後と推定
SCAN_START = 450
SCAN_END = 890


def fetch_listing():
    """
    一覧ページから全商品の名前と画像URLを取得する
    HTML構造: div.point > div.white-panel-img > img + テキスト
    """
    print('一覧ページを取得中...')
    res = requests.get(LISTING_URL, headers=HEADERS, timeout=15)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, 'html.parser')

    products = []
    for point in soup.find_all('div', class_='point'):
        img_tag = point.find('img')
        if not img_tag:
            continue
        img_src = img_tag.get('src', '')
        # pokemonkorea ドメインの商品画像のみ対象
        if 'pokemonkorea' not in img_src and 'data1' not in img_src:
            continue
        name = point.get_text(strip=True)
        if name:
            products.append({'name': name, 'img_src': img_src})

    print(f'一覧ページから {len(products)} 件取得')
    return products


def parse_detail_page(html, card_id):
    """
    /card/{id} ページから価格・名前・画像を解析する
    価格形式: 「가격 1,000원(1팩), 30,000원(1상자)」
    """
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text()

    # 商品名を取得（ナビ後の最初のh2/h3タグか、特定のブロック）
    name = ''
    for tag in soup.find_all(['h2', 'h3', 'h4']):
        t = tag.get_text(strip=True)
        if '확장팩' in t or '스타터' in t or '덱' in t or '팩' in t:
            name = t
            break

    # 「가격」行から価格を抽出
    # 形式: 가격 X,XXX원(1팩), XX,XXX원(1상자)
    price_line = re.search(r'가격\s+(.*?)(?:\n|발매일|구성물)', text, re.DOTALL)
    price1, price2 = 0, 0
    if price_line:
        prices_raw = re.findall(r'([\d,]+)원', price_line.group(1))
        prices = [int(p.replace(',', '')) for p in prices_raw]
        if len(prices) >= 1:
            price1 = prices[0]
        if len(prices) >= 2:
            price2 = prices[1]

    # 発売日を確認（スパムページでないかチェック）
    has_release = '발매일' in text

    # 画像URL（data1.pokemonkorea.co.kr の最初の画像）
    img_src = ''
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if 'data1.pokemonkorea' in src:
            img_src = src
            break

    if not has_release or not name:
        return None

    return {
        'card_id': card_id,
        'name': name,
        'img_src': img_src,
        'price1': price1,
        'price2': price2,
    }


def scan_card_pages():
    """
    /card/{id} を範囲スキャンして拡張팩情報を収集する
    """
    print(f'/card/{SCAN_START}〜{SCAN_END} をスキャン中... (約{(SCAN_END-SCAN_START)*0.3/60:.1f}分)')
    results = []

    for card_id in range(SCAN_END, SCAN_START - 1, -1):
        url = f'{BASE_URL}/card/{card_id}'
        try:
            res = requests.get(url, headers=HEADERS, timeout=10)
            if res.status_code != 200:
                time.sleep(0.2)
                continue

            detail = parse_detail_page(res.text, card_id)
            if detail:
                print(f"  [{card_id}] {detail['name']} | 가격1:{detail['price1']:,}원 가격2:{detail['price2']:,}원")
                results.append(detail)

        except Exception:
            pass

        time.sleep(0.3)

    print(f'スキャン完了: {len(results)} 件の拡張パックを発見')
    return results


def run_listing():
    """ステップ1: 一覧ページから名前・画像をDBに保存（価格は0で登録）"""
    from cards.models import ExpansionPack

    items = fetch_listing()
    if not items:
        print('データが取得できませんでした')
        return

    saved = 0
    with transaction.atomic():
        for item in items:
            obj, created = ExpansionPack.objects.get_or_create(
                name=item['name'],
                defaults={
                    'img_src': item['img_src'],
                    'price1': 0,
                    'price2': 0,
                    'quantity': 0,
                    'serial_code': '',
                }
            )
            if created:
                saved += 1

    print(f'DBに {saved} 件保存しました（既存スキップ）')


def run_price_scan():
    """ステップ2: サブページスキャンで価格情報を補完する"""
    from cards.models import ExpansionPack

    items = scan_card_pages()
    updated = 0
    with transaction.atomic():
        for item in items:
            # 同名のレコードを探して価格を更新
            qs = ExpansionPack.objects.filter(name=item['name'])
            if qs.exists():
                qs.update(
                    price1=item['price1'],
                    price2=item['price2'],
                    img_src=item['img_src'] or qs.first().img_src,
                )
                updated += 1
            else:
                # 一覧にないが詳細ページにある商品は新規作成
                ExpansionPack.objects.create(
                    name=item['name'],
                    img_src=item['img_src'],
                    price1=item['price1'],
                    price2=item['price2'],
                    quantity=0,
                    serial_code='',
                )
                updated += 1

    print(f'価格更新: {updated} 件')
