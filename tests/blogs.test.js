const Page = require('./helpers/page');

let page;

beforeEach( async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach( async () => {
  await page.close();
});

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a[href="/blogs/new"]');
  });

  test('Assert blog create form is accessible', async () => {
    const label = await page.getContentsOf('.title label');

    expect(label).toEqual('Blog Title');
  });

  describe('and using valud inputs', async () => {
    beforeEach(async () => {
      // type valid inputs in the form and then click submit
      await page.type('form .title input', 'Test title');
      await page.type('form .content input', 'Test content');
      await page.click('form button.teal');
    });

    test('Assert we\'re taken to review screen', async () => {
      const header = await page.getContentsOf('form h5');
      expect(header).toEqual('Please confirm your entries');
    });

    test('Assert after saving the new post is in the index', async () => {
      // this action makes an AJAX to backend to save the post... Jest ain't got time fo dat.
      await page.click('form button.green');
      // wait for a selector in the list page, that does not exist in the previous page
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('.card-content p');

      expect(title).toEqual('Test title');
      expect(content).toEqual('Test content');
    });
  });

  describe('and using invalid inputs', async () => {
    beforeEach(async () => {
      // try clicking submit button on an empty form
      await page.click('form button.teal');
    });

    test('Assert the form shows an error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    })
  })
});

describe('When not logged in', async () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs'
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'T',
        content: 'c'
      }
    }
  ];

  test('Assert blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions); // this should return an array of objects with the {error}

    for (result of results) expect(result).toEqual({error: 'You must log in!'});
  });
});