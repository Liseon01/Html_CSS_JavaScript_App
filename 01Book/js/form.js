const API_BASE_URL = "http://localhost:8080";

const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");

document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});


bookForm.addEventListener("submit", function (event) {

    event.preventDefault();
    console.log("Form 이 체출 되었음....");

    const bookFormData = new FormData(bookForm);

    const bookData = {
        title: (bookFormData.get("title") || "").trim(),
        author: (bookFormData.get("author") || "").trim(),
        isbn: (bookFormData.get("isbn") || "").trim(),
        price: (bookFormData.get("price") || "").trim(),
        publishDate: bookFormData.get("publishDate"),
    };

    if (!validateBook(bookData)) {
        return;
    }

    console.log(bookData);

});

function validateBook(book) {
    if (!book.title) {
        alert("제목을 입력해주세요.");
        return false;
    }
    if (!book.author) {
        alert("저자를 입력해주세요.");
        return false;
    }
    if (!book.isbn) {
        alert("ISBN을 입력해주세요.");
        return false;
    }
    const isbnPattern = /^[0-9-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert("ISBN은 숫자와 하이픈(-)만 입력 가능합니다.");
        return false;
    }
    if (book.price) {
        const pricePattern = /^[0-9]+$/;
        if (!pricePattern.test(book.price)) {
            alert("가격은 숫자만 입력 가능합니다.");
            return false;
        }
    }
    return true;
} //validateBook

function loadBooks() {
    console.log("도서 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`) //Promise
        .then((response) => {
            if (!response.ok) {
                throw new Error("도서 목록을 불러오는데 실패했습니다!.");
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log("Error: " + error);
            alert("도서 목록을 불러오는데 실패했습니다!.");
        });
}

function renderBookTable(books) {
    console.log(books);
    bookTableBody.innerHTML = "";

    books.forEach((book) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.detail ? book.detail.price : "-"}</td>
            <td>${book.detail ? book.detail.publishDate || "-" : "-"}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;

        bookTableBody.appendChild(row);
    });
}
