
// Put this in src/main.tsx, imported once before ReactDOM.render — or in its
// own src/axiosConfig.ts, imported at the top of main.tsx.

import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';   // Django's default CSRF cookie name
axios.defaults.xsrfHeaderName = 'X-CSRFToken'; // header name Django's CsrfViewMiddleware expects