SELECT cron.unschedule('invoke-send-scheduled-notifications');
SELECT cron.unschedule('send-scheduled-notifications-edge');
SELECT cron.unschedule('cleanup-internal-logs-daily');
SELECT cron.schedule(
  'cleanup-internal-logs-hourly',
  '15 * * * *',
  $cmd$
  DELETE FROM cron.job_run_details WHERE end_time < NOW() - INTERVAL '6 hours';
  DELETE FROM net._http_response WHERE created < NOW() - INTERVAL '6 hours';
  $cmd$
);