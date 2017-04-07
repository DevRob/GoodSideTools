var React = require('react');
var DefaultLayout = require('./layout/master');
var Repeat = require('./repeat');

var IndexComponent = React.createClass({
  render: function() {
    return (
      <DefaultLayout name={ this.props.name }>
        <Repeat></Repeat>
      </DefaultLayout>
    )
  }
});

module.exports = IndexComponent;
