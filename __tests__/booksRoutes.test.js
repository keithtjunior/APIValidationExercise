process.env.NODE_ENV = 'test';
const request = require('supertest');

const app = require('../app');
const db = require('../db');

const book = {
    isbn: '1684156858',
    amazon_url: 'https://www.amazon.com/BRZRKR-Vol-1-Matt-Kindt/dp/1684156858',
    author: 'Keanu Reeves',
    language: 'english',
    pages: 144,
    publisher: 'BOOM! Studios',
    title: 'BRZRKR Vol. 1',
    year: 2021
}
let bookResults;

describe('Books Routes Test', function () {

    beforeEach(async function () {
        await db.query('DELETE FROM books');
        bookResults = await db.query(
            `INSERT INTO books (
                  isbn,
                  amazon_url,
                  author,
                  language,
                  pages,
                  publisher,
                  title,
                  year) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               RETURNING *`,
            [book.isbn, book.amazon_url, book.author,
              book.language, book.pages, book.publisher,
              book.title, book.year]
          );
    });

    describe('GET /books/', function () {
        test('can get list of all books', async function () {
            let response = await request(app).get('/books/');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ books: [book]});
        });
    });

    describe('GET /books/:id', function () {
        test('can get book by isbn', async function () {
            let response = await request(app).get(`/books/${book.isbn}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ book });
        });

        test("can't get book by wrong isbn", async function () {
            let response = await request(app).get(`/books/0`);
            expect(response.statusCode).toBe(404);
        });
    });

    describe('POST /books/', function () {
        test('can create a book', async function () {

            let newBook = {
                isbn: '1684058414',
                amazon_url: 'https://www.amazon.com/Teenage-Mutant-Ninja-Turtles-Ronin/dp/1684058414',
                author: 'Kevin Eastman',
                language: 'english',
                pages: 224,
                publisher: 'IDW Publishing',
                title: 'Teenage Mutant Ninja Turtles: The Last Ronin (Hardcover)',
                year: 2022
            }

            let response = await request(app).post(`/books/`)
            .send(newBook);

            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual({ book: newBook });
        });

        test("can't create a book / returns errors", async function () {

            let newBook = {
                isbn: '1684058414',
                amazon_url: 'https://www.amazon.com/Teenage-Mutant-Ninja-Turtles-Ronin/dp/1684058414',
                author: 'Kevin Eastman',
                language: 'english',
                publisher: 'IDW Publishing',
                title: 'Teenage Mutant Ninja Turtles: The Last Ronin (Hardcover)',
                year: 'abc'
            }

            let response = await request(app).post(`/books/`)
            .send(newBook);

            expect(response.statusCode).toBe(400);
            expect(response.body.error.message)
                .toContain('instance requires property "pages"');
            expect(response.body.error.message)
                .toContain('instance.year is not of a type(s) integer');
        });
    });

    afterAll(async function () {
        await db.end();
    });

});