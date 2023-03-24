# Generated by Django 3.1.4 on 2021-03-05 07:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('botPlatform', '0001_initial'),
        ('bot', '0002_bot_organization_id'),
        ('botData', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FallbackMessage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bot_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='bot.bot')),
                ('message_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='botData.message')),
                ('user_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='botPlatform.botuserinfo')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]