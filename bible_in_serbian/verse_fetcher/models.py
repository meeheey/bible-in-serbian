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
    chapter_mask = models.CharField(max_length=50, blank=True)  # New CharField for chapter_mask
    verse_number = models.IntegerField()
    verse_number_mask = models.CharField(max_length=50, blank=True)  # New CharField for verse_number_mask
    verse = models.TextField(blank=True, null=True)

    class Meta:
        managed = False  # Keep this if you don't want Django to manage the table
        db_table = 'verses'
        ordering = ['chapter', 'verse_number']

    def __str__(self):
        return f"{self.book.acronym} {self.chapter}:{self.verse_number}"  # Add a string representation

    def save(self, *args, **kwargs):
        # Set default values if not provided
        if not self.chapter_mask:
            self.chapter_mask = str(self.chapter)  # Convert to string (CharField)
        if not self.verse_number_mask:
            self.verse_number_mask = str(self.verse_number)  # Convert to string (CharField)
        super().save(*args, **kwargs)