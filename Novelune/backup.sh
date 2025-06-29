# Бэкап базы данных и загруженных файлов

#!/bin/bash
TIMESTAMP=$(date +"%F-%H-%M")
BACKUP_DIR="/home/root/TaskRepo_NA1/Novelune/backups"
mkdir -p $BACKUP_DIR

# Бэкап базы данных
mysqldump -u root -p'234441' novelune > $BACKUP_DIR/novelune-$TIMESTAMP.sql

# Бэкап загруженных файлов
cp -r /home/root/TaskRepo_NA1/Novelune/client/uploads $BACKUP_DIR/uploads-$TIMESTAMP
