//전역변수
const API_BASE_URL = "http://localhost:8080";

//DOM 엘리먼트 가져오기
const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");

//Document Load 이벤트 처리하기
document.addEventListener("DOMContentLoaded", function () {
    loadStudents();
});
//StudentForm 의 Submit 이벤트 처리하기
studentForm.addEventListener("submit", function (event) {
    //기본으로 설정된 Event가 동작하지 않도록 하기 위함
    event.preventDefault();
    console.log("Form 이 체출 되었음....")

    //FormData 객체생성 <form>엘리먼트를 객체로 변환
    const stuFormData = new FormData(studentForm);
    // stuFormData.forEach((value, key) => {
    //     console.log(key + ' = ' + value);
    // });

    //사용자 정의 Student Object Literal 객체생성 (공백 제거 trim())
    const studentData = {
        name: stuFormData.get("name").trim(),
        studentNumber: stuFormData.get("studentNumber").trim(),
        address: stuFormData.get("address").trim(),
        phoneNumber: stuFormData.get("phoneNumber").trim(),
        email: stuFormData.get("email").trim(),
        dateOfBirth: stuFormData.get("dateOfBirth"),
    }

    //유효성 체크하는 함수 호출하기
    if (!validateStudent(studentData)) {
        //검증체크 실패하면 리턴하기
        return;
    }

    //유효한 데이터 출력하기
    console.log(studentData);

}); //submit 이벤트

//입력항목의 값의 유효성을 체크하는 함수
function validateStudent(student) {// 필수 필드 검사
    if (!student.name) {
        alert("이름을 입력해주세요.");
        return false;
    }

    if (!student.studentNumber) {
        alert("학번을 입력해주세요.");
        return false;
    }
    // 학번 형식 검사 (예: 영문과 숫자 조합)
    //const studentNumberPattern = /^[A-Za-z0-9]+$/;
    const studentNumberPattern = /^[A-Za-z]\d{5}$/;
    if (!studentNumberPattern.test(student.studentNumber)) {
        alert("학번은 영문(S)과 숫자(5자리)만 입력 가능합니다.");
        return false;
    }

    if (!student.address) {
        alert("주소를 입력해주세요.");
        return false;
    }

    if (!student.phoneNumber) {
        alert("전화번호를 입력해주세요.");
        return false;
    }

    if (!student.email) {
        alert("이메일을 입력해주세요.");
        return false;
    }

    // 전화번호 형식 검사
    const phonePattern = /^[0-9-\s]+$/;
    if (!phonePattern.test(student.phoneNumber)) {
        alert("올바른 전화번호 형식이 아닙니다.");
        return false;
    }

    // 이메일 형식 검사 (입력된 경우에만)
    if (student.email && !isValidEmail(student.email)) {
        alert("올바른 이메일 형식이 아닙니다.");
        return false;
    }

    return true;
}//validateStudent

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}//isValidEmail

//Student(학생) 목록을 Load 하는 함수
function loadStudents() {
    console.log("학생 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/students`) //Promise
        .then((response) => {
            if (!response.ok) {
                throw new Error("학생 목록을 불러오는데 실패했습니다!.");
            }
            return response.json();
        })
        .then((students) => renderStudentTable(students))
        .catch((error) => {
            console.log("Error: " + error);
            alert("학생 목록을 불러오는데 실패했습니다!.");
        });
};

function renderStudentTable(students) {
    console.log(students);
    studentTableBody.innerHTML = "";

    students.forEach((student) => {
        //<tr> 엘리먼트를 생성하기
        const row = document.createElement("tr");
        
        //<tr>의 content을 동적으로 생성
        row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.studentNumber}</td>
                    <td>${student.detail ? student.detail.address : "-"}</td>
                    <td>${student.detail ? student.detail.phoneNumber : "-"}</td>
                    // <td>${student.detail ? student.detail.email || "-" : "-"}</td>
                    <td>${student.detail?.email ?? "-"}</td>
                    <td>${student.detail ? student.detail.dateOfBirth || "-" : "-"}</td>
                    <td>
                        <button class="edit-btn" onclick="editStudent(${student.id})">수정</button>
                        <button class="delete-btn" onclick="deleteStudent(${student.id})">삭제</button>
                    </td>
                `;
        //<tbody>의 아래에 <tr>을 추가시켜 준다.
        studentTableBody.appendChild(row);
    });    

}//renderStudentTable