var React = require('react');

var ListComponent = React.createClass({
  render: function() {
    return (
      <div>
          <ul>
              <li rt-repeat="item in this.state.items">{ item }</li>
          </ul>
      </div>
    )
  }
});

function Item(props) {
  return <li>{props.message}</li>;
}

function TodoList() {
  const todos = { this.prop.options };
  console.log(todos);
  return (
    <ul>
      {todos.map((message) => <Item key={message} message={message} />)}
    </ul>
  );
}

module.exports = ListComponent;
