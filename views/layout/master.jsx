const React = require('react');

var MasterLayout = React.createClass({
  render: function() {
    return (
      <html itemscope="" itemtype="http://schema.org/WebPage" lang="en-IE">
      <head>
        <meta></meta>
        <link></link>
        <title>{ this.props.name }</title>
      </head>
      <body>
        { this.props.children }
      </body>
      </html>
    )
  }
});

module.exports = MasterLayout;
