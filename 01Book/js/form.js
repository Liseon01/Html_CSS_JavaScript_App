// ========================
// 전역설정 & DOM 캐시
// ========================
const API_BASE_URL = "http://localhost:8080";
var editingBookId = null;

const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");

// 메시지 유틸(방어코드)
function showSuccess(message) {
  const el = document.getElementById('formError');
  if (el) { el.textContent = message; el.style.display = 'block'; el.style.color = '#28a745'; }
  else { alert(message); }
}
function showError(message) {
  const el = document.getElementById('formError');
  if (el) { el.textContent = message; el.style.display = 'block'; el.style.color = '#dc3545'; }
  else { alert(message); }
}
function clearMessages() {
  const el = document.getElementById('formError');
  if (el) el.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
});

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const fd = new FormData(bookForm);
  const rawPrice = (fd.get("price") || "").trim();

  const bookData = {
    title: (fd.get("title") || "").trim(),
    author: (fd.get("author") || "").trim(),
    isbn: (fd.get("isbn") || "").trim(),
    price: rawPrice === "" ? null : Number(rawPrice),
    publishDate: fd.get("publishDate") || null,
  };

  console.log("REQUEST >", bookData);

  if (!validateBook(bookData)) return;

  if (editingBookId) updateBook(editingBookId, bookData);
  else createBook(bookData);
});

function validateBook(book) {
  if (!book.title) { alert("제목을 입력해주세요."); return false; }
  if (!book.author) { alert("저자를 입력해주세요."); return false; }
  if (!book.isbn) { alert("ISBN을 입력해주세요."); return false; }

  const isbnPattern = /^[0-9-]+$/;
  if (!isbnPattern.test(book.isbn)) {
    alert("ISBN은 숫자와 하이픈(-)만 입력 가능합니다."); return false;
  }

  if (book.price === null || Number.isNaN(book.price)) {
    alert("가격(정수)을 입력해주세요."); return false;
  }
  if (book.price <= 0) {
    alert("가격은 0보다 큰 값이어야 합니다."); return false;
  }

  if (!book.publishDate) { alert("출판일을 입력해주세요."); return false; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(book.publishDate)) {
    alert("출판일 형식이 올바르지 않습니다.(YYYY-MM-DD)"); return false;
  }
  return true;
}

function loadBooks() {
  console.log("도서 목록 Load 중.....");
  fetch(`${API_BASE_URL}/api/books`)
    .then((res) => {
      if (!res.ok) throw new Error("도서 목록을 불러오는데 실패했습니다!.");
      return res.json();
    })
    .then((books) => renderBookTable(books))
    .catch((err) => {
      showError(err.message);
      bookTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:#dc3545;">
            오류: 데이터를 불러올 수 없습니다.
          </td>
        </tr>`;
    });
}

function renderBookTable(books) {
  bookTableBody.innerHTML = "";
  (books || []).forEach((book) => {
    const row = document.createElement("tr");
    const safeTitle = (book.title || "").replace(/'/g, "\\'");
    row.innerHTML = `
      <td>${book.title ?? ""}</td>
      <td>${book.author ?? ""}</td>
      <td>${book.isbn ?? ""}</td>
      <td>${book.price ?? "-"}</td>
      <td>${book.publishDate ?? "-"}</td>
      <td>
        <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
        <button class="delete-btn" onclick="deleteBook(${book.id}, '${safeTitle}')">삭제</button>
      </td>
    `;
    bookTableBody.appendChild(row);
  });
}

async function createBook(bookData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });

    if (!res.ok) {
      const msg = await safeExtractError(res);
      if (res.status === 409) throw new Error(msg || "중복 되는 정보가 있습니다.");
      throw new Error(msg || "도서 등록에 실패했습니다.");
    }

    await res.json().catch(()=>({}));
    showSuccess("도서가 성공적으로 등록되었습니다!");
    bookForm.reset();
    loadBooks();
  } catch (err) {
    console.error("CREATE ERROR >", err);
    showError(err.message);
  }
}

async function editBook(bookId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`);
    if (!res.ok) {
      const msg = await safeExtractError(res);
      if (res.status === 404) throw new Error(msg || "존재하지 않는 도서입니다.");
      throw new Error(msg || "도서 조회에 실패했습니다.");
    }
    const book = await res.json();

    bookForm.title.value = book.title ?? "";
    bookForm.author.value = book.author ?? "";
    bookForm.isbn.value = book.isbn ?? "";
    bookForm.price.value = book.price ?? "";
    bookForm.publishDate.value = book.publishDate ?? "";

    editingBookId = bookId;
    submitButton.textContent = "도서 수정";
    if (cancelButton) cancelButton.style.display = "inline-block";
    clearMessages();
  } catch (err) {
    showError(err.message);
  }
}

async function updateBook(bookId, bookData) {
  try {
    // ✅ 수정 시에도 detailRequest 반드시 포함
    if (!("detailRequest" in bookData)) bookData.detailRequest = {};

    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    if (!res.ok) {
      const msg = await safeExtractError(res);
      if (res.status === 409) throw new Error(msg || "중복 되는 정보가 있습니다.");
      throw new Error(msg || "도서 수정에 실패했습니다.");
    }
    await res.json().catch(()=>({}));

    showSuccess("도서가 성공적으로 수정되었습니다!");
    resetForm();
    loadBooks();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteBook(bookId, bookTitle) {
  if (!confirm(`제목 = ${bookTitle ?? ''} 도서를 정말로 삭제하시겠습니까?`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`, { method: "DELETE" });
    if (!res.ok) {
      const msg = await safeExtractError(res);
      if (res.status === 404) throw new Error(msg || "존재하지 않는 도서입니다.");
      throw new Error(msg || "도서 삭제에 실패했습니다.");
    }
    showSuccess("도서를 삭제했어.");
    loadBooks();
    if (editingBookId && String(editingBookId) === String(bookId)) resetForm();
  } catch (err) {
    showError(err.message);
  }
}

function resetForm() {
  bookForm.reset();
  editingBookId = null;
  submitButton.textContent = "도서 등록";
  if (cancelButton) cancelButton.style.display = "none";
  clearMessages();
}
if (cancelButton) cancelButton.addEventListener("click", resetForm);

// 서버 에러 메시지 추출(필드 에러 배열 지원)
async function safeExtractError(res) {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const obj = JSON.parse(text);
      if (obj.errors && Array.isArray(obj.errors)) {
        const detail = obj.errors
          .map(e => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(" / ");
        return `${obj.message || ""}${detail ? " - " + detail : ""}`.trim();
      }
      return obj.message || obj.error || text;
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}
