import './entry-config'; // place the first to execute
import ReactDOM from 'react-dom';
import elements from '../routers/routers';
import '../index.less'; // place the latest to override

ReactDOM.render(elements, document.getElementById('root'));
