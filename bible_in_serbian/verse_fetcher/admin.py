from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Books, Verses

admin.site.register(Books)
admin.site.register(Verses)