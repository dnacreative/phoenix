/* global Modernizr */

import ImageUploadFallback from '../images/ImageUploadFallback';
import reportbackTplSrc from 'reportback/templates/reportback.tpl.html';
import ImageUpload from '../images/ImageUpload';

const $ = require('jquery');
const debounce = require('lodash/function/debounce');
const template = require('lodash/string/template');

const Reportback = {

  $initialGallery: null,
  $extendedGallery: null,
  $viewMoreContainer: null,
  $viewMoreButton: null,
  $spinner: null,

  apiUrl: '/api/v1/reportback-items',

  nid: null,

  itemIds: null,

  itemsTotalRemaining: 0,

  requestSize: 12,

  inventory: [],

  inventoryIndex: 0,

  galleryInDom: false,

  adminAccess: null,

  uploader: null,

  /**
   * Initialize the Reportback interface.
   *
   * @param  {jQuery} $container  Reportback container object.
   */
  init: function($container = $('#reportback')) {
    if (!$container.length) return;

    this.reportbackContainer = $container;
    this.$reportbackWrapper = this.reportbackContainer.find('.wrapper');
    this.$reportbackForm = this.reportbackContainer.find('#dosomething-reportback-form');
    this.$uploadButton = this.reportbackContainer.find('.js-image-upload');
    this.$captionField = this.$reportbackForm.find('.form-item-caption');
    this.$initialGallery = $container.find('.gallery--reportback');

    this.nid = $container.data('nid');

    // Does the user have admin access?
    this.adminAccess = $container.data('admin');

    // IDs of collected Reportbacks in initial gallery.
    this.itemIds = $container.data('ids');

    // Total number of Reportbacks remaining to be displayed.
    this.itemsTotalRemaining = $container.data('remaining');

    if (this.itemsTotalRemaining > 0) {
      this.apiUrl = this.buildApiUrl();
      this.enableViewMore();
      this.enableResponsive();
    }

    if (Modernizr.filereader) {
      this.imageUploadInit();
    } else {
      ImageUploadFallback.init(this.$uploadButton, '.reportback__submissions');
    }
  },


  /**
   * Add the reportback entries to the DOM.
   * Adds the entire extended gallery if it does not exist already,
   * otherwise just appends the additional entries.
   */
  appendEntries: function() {
    const start = this.inventoryIndex;
    const end = this.inventory.length;
    let $cluster = $();
    let $images = null;

    for (let i = start; i < end; i++) {
      if (this.inventory[i] !== undefined) {
        $cluster = $cluster.add(this.inventory[i]);
      }
    }

    $images = $cluster.find('img');

    $images.unveil(100, function() {
      const $this = $(this);

      $this.load(function() {
        $this.parent('.photo').addClass('is-unveiled');
      });
    });

    if (!this.galleryInDom) {
      this.insertGallery($cluster);
    } else {
      this.$extendedGallery.append($cluster);
    }

    this.inventoryIndex = this.inventoryIndex + (end - start);

    // @TODO: There has to be a better way to trigger unveil to execute and not require a scroll.
    $(window).trigger('scroll');
  },


  /**
   * Build out the API URL with the campaign node id.
   *
   * @return {string}  API base url.
   */
  buildApiUrl: function() {
    return `${this.apiUrl}?campaigns=${this.nid}&status=promoted,approved&exclude=${this.itemIds}&count=${this.requestSize}`;
  },


  /**
   * Remove the View More button.
   */
  disableViewMore: function() {
    this.$viewMoreButton.remove();
  },


  /**
   * Enable Media Query check to shift around markup.
   */
  enableResponsive: function() {
    const _this = this;

    $(window).on('resize', debounce(function() {
      if (_this.isLargerMedia()) {
        if (_this.$viewMoreContainer) {
          _this.$viewMoreContainer.detach();
          _this.$viewMoreContainer.insertAfter(_this.$reportbackWrapper);
        }
      } else {
        if (_this.$viewMoreContainer) {
          _this.$viewMoreContainer.detach();
          _this.$viewMoreContainer.insertAfter(_this.$initialGallery);
        }
      }
    }, 300));
  },


  /**
   * Add the View More button if there are additional reportbacks.
   */
  enableViewMore: function() {
    const _this = this;
    const buttonText = Drupal.t('View more');

    this.$viewMoreContainer = $(`<div class="reportback__view-more"></div>`);
    this.$viewMoreButton = $(`<button id="view-more-button" class="button button--view-more -tertiary inline-alt-text-color">${buttonText}</button>`);

    this.$viewMoreContainer.append(this.$viewMoreButton);

    if (this.isLargerMedia()) {
      this.$viewMoreContainer.insertAfter(this.$reportbackWrapper);
    } else {
      this.$viewMoreContainer.insertAfter(this.$initialGallery);
    }

    this.$viewMoreButton.on('click', function() {
      _this.request();
    });
  },


  /**
   * Initialize the ImageUpload interface.
   */
  imageUploadInit: function() {
    this.uploader = new ImageUpload(this.$uploadButton);

    this.$captionField.hide();
  },


  /**
   * Insert the extended gallery into the DOM.
   *
   * @param  {string} data  Markup of list items.
   */
  insertGallery: function(data) {
    const content = data || null;

    this.$extendedGallery = $(`<ul class="gallery gallery--extended"></ul>`);

    if (content) {
      this.$extendedGallery.html(content);
    }

    this.$viewMoreContainer.prepend(this.$extendedGallery);

    this.galleryInDom = true;
  },


  /**
   * Check to see if media size is large.
   *
   * @return {boolean} true is large media
   */
  isLargerMedia: function() {
    return ($(window).outerWidth() >= 760);
  },


  /**
   * Ajax request to retrieve more Reportback entries.
   */
  request: function() {
    const _this = this;

    $.ajax({
      url: this.apiUrl,
      dataType: 'json',
      beforeSend: function() {
        if (_this.$spinner) {
          _this.$spinner.show();
        } else {
          _this.$spinner = $(`<div class="spinner"></div>`);
          _this.$viewMoreContainer.append(_this.$spinner);
        }
      },
    }).done(function(response) {
      _this.apiUrl = response.meta.pagination.links.next_uri || null;

      _this.templatize(response);

      _this.$spinner.hide();

      _this.appendEntries();
    }).fail(function() {
      // @TODO: handle error here!
    }).always(function() {
      if (!_this.apiUrl) {
        _this.disableViewMore();
      }
    });
  },


  /**
   * Use specified template to markup each reportback entry list item.
   *
   * @param {array} collection JSON object containing reportback items and other meta data.
   */
  templatize: function(collection) {
    const items = collection.data;

    for (let i = 0, count = items.length; i < count; i++) {
      const data = {
        'id': items[i].reportback.id,
        'image': items[i].media.uri,
        'caption': items[i].caption,
        'status': items[i].status,
        'isListItem': true,  // @TODO: probably a better way to address this... :insert shrug emoji here:
      };

      data.adminLink = this.adminAccess ? `/admin/reportback/${items[i].reportback.id}` : false;

      const markup = template(reportbackTplSrc);

      this.inventory.push(markup(data));
    }
  },

};

export default Reportback;
