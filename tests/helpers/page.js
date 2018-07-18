const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({ headless: false });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, prop) {
        return target[prop] || browser[prop] || page[prop]
      }
    })
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { sessionString, sig } = sessionFactory(user);

    // use puppeteer to set these values as cookies
    await this.page.setCookie({name: 'session', value: sessionString});
    await this.page.setCookie({name: 'session.sig', value: sig});
    // refresh the page to re-render the app as a logged in user
    await this.page.goto('localhost:3000/blogs');

    await this.page.waitFor('#root');
  }
  // once and never again
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  async get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json()); // fetch returns raw data
    }, path);
  }

  async post(path, data) {
    return this.page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json());
    }, path, data);
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({method, path, data}) => {
      return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;