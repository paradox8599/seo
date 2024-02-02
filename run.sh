#!/bin/sh
while true; do
	echo "[backup] backup on $(date)"
	fn="db-$(date +%F).sql"
	echo "[backup] pulling db to $fn"
	pg_dump "$DATABASE_URL" >"$fn"
	echo "[backup] uploading backup"
	aws s3 cp $fn "s3://$AWS_BUCKET/sql/$fn"
	echo "[backup] clean up"
	rm -f "$fn"
	echo "[backup] done, waiting for next backup"
	sleep "$((60 * 60 * 24))"
done &

npm run start:ks

kill 0
