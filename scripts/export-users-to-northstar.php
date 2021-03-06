<?php
/**
 * Script to export user information from drupal into Northstar.
 *
 * to run:
 * drush --script-path=../scripts/ php-script export-users-to-northstar.php
 */

include_once('../lib/modules/dosomething/dosomething_northstar/dosomething_northstar.module');

$last_saved = variable_get('dosomething_northstar_last_user_migrated', NULL);
if ($last_saved) {
  $users = db_query("SELECT u.uid
            FROM users u
            WHERE uid > $last_saved
            ORDER BY u.uid");
}
else {
  // Get all the users!
  $users = db_query('SELECT u.uid
                   FROM users u
                   ORDER BY u.uid');
}

foreach ($users as $user) {
  // Create json object
  $user = user_load($user->uid);
  $ns_user = build_northstar_user($user);

  // Don't "forward" the anonymous user.
  if($user->uid == 0) {
    continue;
  }

  // Use old drupal_http_request method.
  $client = _dosomething_northstar_build_http_client();
  $response = drupal_http_request($client['base_url'] . '/users', [
    'headers' => $client['headers'],
    'method' => 'POST',
    'data' => json_encode($ns_user),
  ]);

  // Output progress to stdout & log request details for later review.
  dosomething_northstar_log_request('migrate', $user, $ns_user, $response);
  echo 'Migrated user ' . $user->uid . ' to Northstar [' . $response->code . ']' . PHP_EOL;

  // Store the returned Northstar ID on the user's Drupal profile.
  dosomething_northstar_save_id_field($user->uid, json_decode($response->data));

  // If the script fails, we can use this to start the script from a previous person.
  variable_set('dosomething_northstar_last_user_migrated', $user->uid);
}

/**
 * Build a Northstar request from the $user global variable.
 */
function build_northstar_user($user) {
  $northstar_user = dosomething_northstar_transform_user($user);

  // Since we're sending an existing user, we'll also attach their hashed password
  // (which Northstar can understand thanks to it's DrupalPasswordHash class), and
  // the created_at timestamp on the original account.
  $northstar_user['drupal_password'] = $user->pass;
  $northstar_user['created_at'] = $user->created;

  return $northstar_user;
}
