<?php

/**
 * Implements hook_cron()
 */
 function dosomething_gladiator_cron() {
   dosomething_gladiator_update_campaigns();
   dosomething_gladiator_retry_failed_users();
 }

 function dosomething_gladiator_update_campaigns() {
   $client = _dosomething_gladiator_build_http_client();

   $options = [
     'method' => 'GET',
     'headers' => $client['headers'],
   ];

   $response = drupal_http_request($client['base_url'] . '/contests', $options);

   if ($response->code != 200) {
     return;
   }

   $contests = json_decode($response->data)->data;

   foreach ($contests as $contest) {
     $nid = $contest->campaign->id;
     // For some reason using the boolean value doesnt work in the fields array, have to convert to int.
     $contest_is_open = $contest->waiting_room->open ? 1 : 0;

     db_update('dosomething_signup_data_form')
       ->fields([
         'status' => $contest_is_open,
       ])
       ->condition('nid', $nid)
       ->execute();
   }
 }

 function dosomething_gladiator_retry_failed_users() {
    $task_log = db_select('dosomething_gladiator_failed_task_log', 't')
      ->fields('t')
      ->execute()
      ->fetchAll();
    db_truncate('dosomething_gladiator_failed_task_log')->execute();

    foreach ($task_log as $task) {
      $user = user_load($task->uid);
      $values = [
        'nid' => $task->nid,
        'run_nid' => $task->run_nid,
      ];
      dosomething_gladiator_send_user_to_gladiator($user, $values);
   }
 }
