from django.db import models


class ExpansionPack(models.Model):
    serial_code = models.CharField(max_length=50, blank=True, verbose_name='시리얼코드')
    name = models.CharField(max_length=200, verbose_name='확장팩명')
    price1 = models.IntegerField(default=0, verbose_name='가격1 (낱개)')
    price2 = models.IntegerField(default=0, verbose_name='가격2 (박스)')
    qty_gwangju = models.IntegerField(default=0, verbose_name='재고 (광주)')
    qty_busan = models.IntegerField(default=0, verbose_name='재고 (부산)')
    qty_bonbu = models.IntegerField(default=0, verbose_name='재고 (본부)')
    img_src = models.URLField(max_length=500, blank=True, verbose_name='이미지 URL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expansion_packs'
        ordering = ['id']

    def __str__(self):
        return self.name

    @property
    def qty_total(self):
        return self.qty_gwangju + self.qty_busan + self.qty_bonbu


LOCATION_CHOICES = [
    ('gwangju', '광주'),
    ('busan', '부산'),
    ('bonbu', '본부'),
]

ACTION_CHOICES = [
    ('add', '입고'),
    ('remove', '출고'),
    ('transfer', '이동'),
]


class PhotoRecord(models.Model):
    image_url = models.URLField(max_length=1000, verbose_name='이미지 URL')
    location = models.CharField(max_length=10, choices=LOCATION_CHOICES, verbose_name='위치')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='업로드 일시')

    class Meta:
        db_table = 'photo_records'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.created_at:%Y-%m-%d %H:%M} | {self.location}'


class InventoryLog(models.Model):
    """在庫操作ログ"""
    pack = models.ForeignKey(ExpansionPack, on_delete=models.CASCADE, related_name='logs', verbose_name='확장팩')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='작업')
    location = models.CharField(max_length=10, choices=LOCATION_CHOICES, blank=True, verbose_name='위치')
    from_location = models.CharField(max_length=10, choices=LOCATION_CHOICES, blank=True, verbose_name='출발지')
    to_location = models.CharField(max_length=10, choices=LOCATION_CHOICES, blank=True, verbose_name='도착지')
    quantity = models.IntegerField(verbose_name='수량')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='일시')

    class Meta:
        db_table = 'inventory_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.timestamp:%Y-%m-%d %H:%M} | {self.pack.name} | {self.get_action_display()}'
