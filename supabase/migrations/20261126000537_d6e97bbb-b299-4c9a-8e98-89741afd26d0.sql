SELECT cron.schedule('cleanup-internal-logs-hourly', '15 * * * *', $job$
TRUNCATE TABLE net._http_response;
DELETE FROM cron.job_run_details WHERE end_time < NOW() - INTERVAL '6 hours';
$job$);