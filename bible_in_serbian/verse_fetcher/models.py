from django.db import models

class Books(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    acronym = models.TextField()
    title = models.TextField()

    class Meta:
        managed = False  # Keep this if you don't want Django to manage the table
        db_table = 'books'

    def __str__(self):
        return self.title  # Add a string representation for better readability

class Verses(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    book = models.ForeignKey(Books, on_delete=models.CASCADE)  # Fix on_delete behavior
    chapter = models.IntegerField()
    verse_number = models.IntegerField()
    verse = models.TextField(blank=True, null=True)

    class Meta:
        managed = False  # Keep this if you don't want Django to manage the table
        db_table = 'verses'

    def __str__(self):
        return f"{self.book.acronym} {self.chapter}:{self.verse_number}"  # Add a string representation