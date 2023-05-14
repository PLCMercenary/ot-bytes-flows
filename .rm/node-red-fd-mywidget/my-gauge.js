// Node-RED node implementation for FlexDash widget MyGauge

module.exports = function (RED) {

  const widgetProps = {
  "title": {
    "name": "title",
    "name_text": "Title",
    "name_kebab": "title",
    "msg_name": "title",
    "type": "string",
    "input_type": "str",
    "tip": "Text to display in the widget header. ",
    "default": "My Gauge",
    "default_html": "'My Gauge'"
  },
  "popup_info": {
    "name": "popup_info",
    "name_text": "Popup Info",
    "name_kebab": "popup-info",
    "msg_name": "popup_info",
    "type": "string",
    "input_type": "str",
    "tip": "Info text to display in (i) pop-up. ",
    "default": null,
    "default_html": null
  },
  "value": {
    "msg_name": "payload",
    "name": "value",
    "name_text": "Payload",
    "name_kebab": "value",
    "tip": "",
    "default": null,
    "default_html": null,
    "type": "number",
    "input_type": "num"
  },
  "unit": {
    "msg_name": "unit",
    "name": "unit",
    "name_text": "Unit",
    "name_kebab": "unit",
    "tip": "Superscript after the value. ",
    "default": "",
    "default_html": "",
    "type": "string",
    "input_type": "str"
  },
  "arc": {
    "msg_name": "arc",
    "name": "arc",
    "name_text": "Arc",
    "name_kebab": "arc",
    "tip": "Degrees spanned by the arc of the gauge. ",
    "default": 90,
    "default_html": "90",
    "type": "number",
    "input_type": "num"
  },
  "min": {
    "msg_name": "min",
    "name": "min",
    "name_text": "Min",
    "name_kebab": "min",
    "tip": "Minimum value. ",
    "default": 0,
    "default_html": "0",
    "type": "number",
    "input_type": "num"
  },
  "max": {
    "msg_name": "max",
    "name": "max",
    "name_text": "Max",
    "name_kebab": "max",
    "tip": "Maximum value. ",
    "default": 100,
    "default_html": "100",
    "type": "number",
    "input_type": "num"
  },
  "color": {
    "msg_name": "color",
    "name": "color",
    "name_text": "Color",
    "name_kebab": "color",
    "tip": "Color of filled segment. ",
    "default": "green",
    "default_html": "green",
    "type": "string",
    "input_type": "str"
  },
  "low_color": {
    "msg_name": "low_color",
    "name": "low_color",
    "name_text": "Low Color",
    "name_kebab": "low-color",
    "tip": "Color below low threshold. ",
    "default": "blue",
    "default_html": "blue",
    "type": "string",
    "input_type": "str"
  },
  "high_color": {
    "msg_name": "high_color",
    "name": "high_color",
    "name_text": "High Color",
    "name_kebab": "high-color",
    "tip": "Color above high threshold. ",
    "default": "pink",
    "default_html": "pink",
    "type": "string",
    "input_type": "str"
  },
  "low_threshold": {
    "msg_name": "low_threshold",
    "name": "low_threshold",
    "name_text": "Low Threshold",
    "name_kebab": "low-threshold",
    "tip": "Threshold for low_color, null to disable. ",
    "default": null,
    "default_html": null,
    "type": "number",
    "input_type": "num"
  },
  "high_threshold": {
    "msg_name": "high_threshold",
    "name": "high_threshold",
    "name_text": "High Threshold",
    "name_kebab": "high-threshold",
    "tip": "Threshold for high_color, null to disable. ",
    "default": null,
    "default_html": null,
    "type": "number",
    "input_type": "num"
  },
  "base_color": {
    "msg_name": "base_color",
    "name": "base_color",
    "name_text": "Base Color",
    "name_kebab": "base-color",
    "tip": "Color of unfilled segment. ",
    "default": "grey-lighten-3",
    "default_html": "grey-lighten-3",
    "type": "string",
    "input_type": "str"
  },
  "needle_color": {
    "msg_name": "needle_color",
    "name": "needle_color",
    "name_text": "Needle Color",
    "name_kebab": "needle-color",
    "tip": "Color of needle. ",
    "default": "white",
    "default_html": "white",
    "type": "string",
    "input_type": "str"
  },
  "radius": {
    "msg_name": "radius",
    "name": "radius",
    "name_text": "Radius",
    "name_kebab": "radius",
    "tip": "Inner radius, outer being 100. ",
    "default": 70,
    "default_html": "70",
    "type": "number",
    "input_type": "num"
  },
  "stretch": {
    "msg_name": "stretch",
    "name": "stretch",
    "name_text": "Stretch",
    "name_kebab": "stretch",
    "tip": "False: 2:1 aspect ratio, true: stretch. ",
    "default": false,
    "default_html": "false",
    "type": "boolean",
    "input_type": "bool"
  }
}
  const widgetDefaults = Object.fromEntries(Object.values(widgetProps).map(p => [p.name, p.default]))

  // Instantiate the Node-RED node, 'this' is the node being constructed
  // and config contains the values set by the user in the flow editor.
  function MyGauge(config) {
    RED.nodes.createNode(this, config)

    // Create missing node properties. This is to deal with the fact that if node properties are
    // added in an upgrade then nodes in existing flows don't have them. Besides not having the
    // expected defaults, this breaks the "widget-has-property" check when setting dynamic prop
    // values.
    for (const prop in widgetDefaults) {
      if (!config.hasOwnProperty(prop)) {
        config[prop] = widgetDefaults[prop]
        this.debug("Missing property: " + prop + " added with default: " + config[prop])
      }
    }
  
    // Initialize the widget by pushing the config to its props and get a handle
    // onto the FlexDash widget API.
    // The third arg is the kind of widget to create, if it doesn't exist
    const widget = RED.plugins.get('flexdash').initWidget(this, config, 'MyGauge')
    if (!widget) return // missing config node, thus no FlexDash to hook up to, nothing to do here

    let onNodeRedCustom, onFlexDashCustom
    

    // handle flow input messages, basically massage them a bit and update the FD widget
    this.on("input", msg => {
      // if message has a topic and a `_delete` property then delete array-widget topic
      if ('topic' in msg && msg._delete) {
        widget.deleteTopic(msg.topic)
        return
      }
      // prepare update of widget props
      const props = Object.assign({}, msg) // shallow clone
      const options = { topic: msg.topic, socket: msg._fd_socket}
      delete props.topic
      // custom handler or built-in
      if (onNodeRedCustom) {
        onNodeRedCustom(props, options)
      } else {
        // remap msg.payload to the prop expected by the widget
        if ('value' && 'payload' in props) {
          props['value'] = props.payload
          delete props.payload
        }
      }
      if (props != {}) widget.setProps(props, options)
    })

    // handle messages from the widget, we receive the potential array element topic, the payload
    // sent by the widget, and the socket ID
    if (false) {
      widget.onInput((topic, payload, socket) => {
        let msg
        if (onFlexDashCustom) {
          msg = onFlexDashCustom(topic, payload, socket)
        } else {
          // propagate the payload into the flow and attach the FD socket ID
          msg = { payload: payload, _fd_socket: socket }
          // if loopback is requested, feed the message back to ourselves, implementation-wise,
          // set the payload property of the widget to the payload of the message
          if (config.fd_loopback) {
            // remap msg.payload to the prop expected by the widget
            const pl = 'value' || 'payload'
            console.log(`loopback: ${pl} <= ${payload}`)
            // WARNING: loopback is broadcast, this could have "interesting" effects
            widget.set(pl, payload, {topic}) // do we need to make a shallow clone here?
          }
        }
        if (topic != undefined) msg.topic = topic // array elt topic has priority
        else if (config.fd_output_topic) msg.topic = config.fd_output_topic // optional non-array topic
        this.send(msg)
      })
    }
  }

  RED.nodes.registerType("fd-my-gauge", MyGauge)
}
