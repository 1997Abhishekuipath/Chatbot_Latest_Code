# Generated by Django 3.1.4 on 2021-01-11 05:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0002_auto_20210107_1457'),
    ]

    operations = [
        migrations.CreateModel(
            name='TeamsConfig',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app_id', models.CharField(max_length=255)),
                ('access_token', models.TextField(null=True)),
                ('app_secret', models.CharField(max_length=255)),
            ],
        ),
    ]