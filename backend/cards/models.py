from django.db import models


class ExpansionPack(models.Model):
    """拡張パックの在庫情報"""
    serial_code = models.CharField(max_length=50, blank=True, verbose_name='시리얼코드')
    name = models.CharField(max_length=200, verbose_name='확장팩명')
    price1 = models.IntegerField(default=0, verbose_name='가격1 (낱개)')
    price2 = models.IntegerField(default=0, verbose_name='가격2 (박스)')
    quantity = models.IntegerField(default=0, verbose_name='수량')
    img_src = models.URLField(max_length=500, blank=True, verbose_name='이미지 URL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expansion_packs'
        ordering = ['id']

    def __str__(self):
        return self.name
