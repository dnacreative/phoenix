<?php

/**
 * Generates site-wide page chrome.
 * @see https://drupal.org/node/1728148
 **/

?>

<?php if (!empty($tabs['#primary'])): ?><nav class="admin--tabs"><?php print render($tabs); ?></nav><?php endif; ?>
<?php print $messages; ?>

<div class="chrome--wrapper">
  <?php print $variables['navigation']; ?>
  <?php print $variables['header']; ?>

  <main role="main" class="container">
    <div class="wrapper">
      <?php if (!empty($noresults_copy)): ?>
        <h3><?php print $noresults_copy; ?></h3>
      <?php endif; ?>
      <?php print render($page['content']); ?>
      <?php if (!empty($noresults_copy)): ?>
        <?php print $recommended_campaigns; ?>
      <?php endif; ?>
    </div>
  </main>

  <?php print $variables['footer']; ?>
</div>

