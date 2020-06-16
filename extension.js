'use strict';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Slider = imports.ui.slider;
const PopupMenu = imports.ui.popupMenu;
const MaxOpacity = 150;
const MinOpacity = 0;

var monitors = Main.layoutManager.monitors;
var indicator = null;
var box = null;
var currentOpacity = MaxOpacity;
var popup;
var slider;             
var totalWidth = 0;

// Extend the Button class from Panel Menu and do some setup in the init() function.
var DimIndicator = class DimIndicator extends PanelMenu.Button 
{
  _init() 
  {
    super._init(0.0, `${Me.metadata.name} Indicator`, false);

    // Set an icon in the top menu
    let icon = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'display-brightness-symbolic'}),
        style_class: 'system-status-icon'
    });

    this.actor.add_child(icon);

    // Add a popup and append to the menu
    this.popup = new PopupMenu.PopupBaseMenuItem({ activate: false });
    this.menu.addMenuItem(this.popup);

    // Create a slider and add to the popup
    this.slider = new Slider.Slider(0);
    this.slider.value = currentOpacity;
    this.slider.connect('notify::value', this.sliderChanged.bind(this));
    this.popup.actor.add(this.slider.actor);
    
    // Add enable and disable buttons
    this.menu.addAction('Enable', this.dimAction.bind(), null);
    this.menu.addAction('Disable', this.undimAction.bind(), null);
    
    // Generate box and set on the screen
    this.generateBox();
    
    // Set prefered opacity for the first time
    this.updateAction();   
 }

  generateBox() 
  { 
    if( ! box) 
    {
      box = new St.Label({ style_class: 'dim-label', text: "" });
    }

    // Make sure the width spans all screens
    for (let i = 0; i < monitors.length; i++) {
      totalWidth = totalWidth + monitors[i].width;
    }
    
    box.set_position(0, 0);
    box.set_width(totalWidth);
    box.set_height(monitors[0].height);
    
    Main.uiGroup.add_actor(box);
  }

  sliderChanged(slider) 
  {
    currentOpacity = parseInt(slider.value * MaxOpacity);
    this.updateAction();
  }

  updateAction()
  {
    box.opacity = currentOpacity;
  }

  dimAction() 
  {
    box.opacity = MaxOpacity;
    indicator.slider.value = MaxOpacity;
  }
  
  undimAction() 
  {
    box.opacity = MinOpacity;
    indicator.slider.value = MinOpacity;
  }
}

function init() 
{
  DimIndicator = GObject.registerClass({GTypeName: 'DimIndicator'}, DimIndicator);    
}


function enable() 
{ 
  indicator = new DimIndicator();
  Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, indicator);
}

function disable() 
{
  Main.uiGroup.remove_actor(box);

  if (indicator !== null) 
  {
    indicator.destroy();
    indicator = null;
  }
}
