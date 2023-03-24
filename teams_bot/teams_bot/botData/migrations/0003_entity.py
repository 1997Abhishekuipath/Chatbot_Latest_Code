# Generated by Django 3.1.4 on 2021-08-31 14:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0004_agent_description'),
        ('botData', '0002_fallbackmessage'),
    ]

    operations = [
        migrations.CreateModel(
            name='Entity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_key', models.CharField(max_length=255)),
                ('entity_synonyms', models.JSONField(blank=True, default=list, null=True)),
                ('entity_value', models.CharField(max_length=255)),
                ('bot_id', models.ManyToManyField(to='bot.Bot')),
            ],
        ),
    ]
