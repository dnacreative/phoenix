<?php

/**
 * Form constructor to configure onboarding for a given $node.
 *
 * @param object $node
 *   The loaded node to save the signup data form configuration for.
 */
function dosomething_signup_node_onboarding_form($form, &$form_state, $node) {
  $nid = $node->nid;

  // Load the node's helpers variables.
  $vars = dosomething_helpers_get_variables('node', $nid);

  $form['nid'] = array(
    '#type' => 'hidden',
    '#value' => $nid,
  );
  $form[$fieldset] = array(
    '#type' => 'fieldset',
    '#title' => t('Onboarding'),
    '#weight' => 60,
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );
  $form[$fieldset]['show_onboarding'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show onboarding'),
    '#default_value' => $vars['show_onboarding'],
  );
  $form[$fieldset]['actions'] = array(
    '#type' => 'actions',
    'submit' => array(
      '#type' => 'submit',
      '#value' => 'Save',
    ),
  );

  return $form;
}

/**
 * Submit callback for dosomething_signup_node_onboarding_form().
 * @TODO - We might want to store values in the db if this form starts configuring content for
 * on boarding experience. Right now, just storing an off/on flag as a helper variable.
 */
function dosomething_signup_node_onboarding_form_submit(&$form, &$form_state) {
  $var_names = ['show_onboarding'];

  foreach($var_names as $var_name) {
    $values = $form_state['values'];
    dosomething_helpers_set_variable('node', $values['nid'], $var_name, $values[$var_name]);
  }

  drupal_set_message("Updated.");
}

/*
 * Gets the onboarding flag.
 */
function dosomething_signup_get_onboarding_status($nid) {
  $vars = dosomething_helpers_get_variables('node', $nid);

  return $vars['show_onboarding'];
}