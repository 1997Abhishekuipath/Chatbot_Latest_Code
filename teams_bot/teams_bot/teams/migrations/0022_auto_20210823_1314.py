# Generated by Django 3.1.4 on 2021-08-23 07:44

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0021_auto_20210607_2114'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversationparameters',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2021, 8, 23, 13, 14, 19, 640425)),
        ),
    ]
