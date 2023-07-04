import "./styles.css";
const baseURL = "https://frontend.tabling.co.kr";

const fetchReservations = async () => {
  try {
    const response = await fetch(`${baseURL}/v1/store/9533/reservations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    console.info(result);
    return result;
  } catch (e) {
    console.error("Error:", e);
  }
};

const makeDetailRow = (key, value, addedClassName = "") => {
  return `
    <div class="reservation-detail-row">
      <div class="reservation-detail-key">${key}</div>
      <div class="reservation-detail-value ${addedClassName}">${value}</div>
    </div>
  `;
};

const showFormatDetail = (reservation, init = true) => {
  const status = reservation.status === "reserved" ? "예약" : "착석 중";
  const reservationDetailDiv = document.getElementById("reservation-detail");

  const formatedDetail = `
    <div class="reservation-detail-container">
      <h2>예약 정보</h2>
      ${makeDetailRow("예약 상태", status)}
      ${makeDetailRow("예약 시간", reservation.timeReserved.slice(0, -3))}
      ${makeDetailRow("접수 시간", reservation.timeRegistered.slice(0, -3))}
      <h2>고객 정보</h2>
      ${makeDetailRow("고객 성명", reservation.customer.name)}
      ${makeDetailRow("고객 등급", reservation.customer.level)}
      ${makeDetailRow("고객 메모", reservation.customer.memo, "three-line")}
      ${makeDetailRow("요청 사항", reservation.customer.request, "three-line")}
    </div>
  `;
  reservationDetailDiv.innerHTML = formatedDetail;
  if (init && window.innerWidth < 1024) {
    const popupDiv = document.getElementById("reservation-detail-popup");
    const popupContentDiv = document.getElementById(
      "reservation-detail-popup-content"
    );
    popupContentDiv.innerHTML = formatedDetail;
    document.getElementById("dimmed-background").style.display = "block";
    setTimeout(() => {
      popupDiv.style.transform = "translateY(0)";
      popupDiv.style.opacity = "1";
    }, 50);
    document.body.style.overflowY = "hidden";
  }
};

const closePopup = () => {
  const popupDiv = document.getElementById("reservation-detail-popup");
  const popupContentDiv = document.getElementById(
    "reservation-detail-popup-content"
  );
  document.getElementById("dimmed-background").style.display = "none";
  popupDiv.style.transform = "translateY(100%)";
  popupDiv.style.opacity = "0";
  document.body.style.overflowY = "auto";
};

const makeElementSeat = (id) => {
  const targetItem = document.getElementById(`reservation-item-${id}`);
  const targetButton = targetItem.getElementsByClassName("seat-button")[0];

  targetButton.innerText = "퇴석";

  targetButton.removeEventListener("click", handleSeatClick);

  const handleClick = function (e) {
    e.stopPropagation();
    targetItem.remove();

    targetButton.removeEventListener("click", handleClick);
  };
  targetButton.addEventListener("click", handleClick);
};

const formatReservation = (reservation) => {
  const status = reservation.status === "reserved" ? "예약" : "착석 중";
  const statusColor = reservation.status === "reserved" ? "#3BB94C" : "#162149";
  const customerName = reservation.customer.name;
  const tables =
    (reservation.tables.length > 1 ? "[" : "") +
    reservation.tables.map((table) => table.name).join(", ") +
    (reservation.tables.length > 1 ? "]" : "");
  const adult = reservation.customer.adult;
  const child = reservation.customer.child;
  const menus =
    (reservation.menus.length > 1 ? "[" : "") +
    reservation.menus.map((menu) => `${menu.name}(${menu.qty})`).join(", ") +
    (reservation.menus.length > 1 ? "]" : "");
  const reservationTime = reservation.timeReserved.split(" ")[1].slice(0, 5);

  return `
    <div class="reservation-item" id="reservation-item-${reservation.id}">
      <div class="reservation-item-time-status" style="color: ${statusColor}">
        <div>${reservationTime}</div>
        <div>${status}</div>
      </div>
      <div class="reservation-item-details">
        <div class="reservation-item-details-detail">${customerName} - ${tables}</div>
        <div class="reservation-item-details-detail">성인 ${adult} 아이 ${child}</div>
        <div class="reservation-item-details-detail">${menus}</div>
      </div>
      <div class="reservation-item-action">
        <button class="seat-button">
          ${reservation.status === "reserved" ? "착석" : "퇴석"}
        </button>
      </div>
    </div>
  `;
};

const handleSeatClick = (e, id) => {
  e.stopPropagation();
  makeElementSeat(id);
};

const displayReservations = (reservations) => {
  const reservationListDiv = document.getElementById("reservation-list");

  const filteredReservations = reservations.filter(
    (reservation) => reservation.status !== "done"
  );

  filteredReservations.forEach((reservation) => {
    const formattedReservationItem = formatReservation(reservation);
    reservationListDiv.innerHTML += formattedReservationItem;
  });
  filteredReservations.forEach((reservation) => {
    const targetItem = document.getElementById(
      `reservation-item-${reservation.id}`
    );
    const targetButton = targetItem.getElementsByClassName("seat-button")[0];
    if (targetButton.innerText === "착석") {
      targetButton.addEventListener("click", (e) =>
        handleSeatClick(e, reservation.id)
      );
    } else {
      makeElementSeat(reservation.id);
    }
  });

  reservationListDiv.addEventListener("click", (e) => {
    let target = e.target;
    while (target.className !== "reservation-item") {
      if (target.className === "reservation-list") return;
      target = target.parentElement;
    }
    const id = target.id.split("-")[2];
    const clickedReservation = reservations.find((el) => el.id === id);
    showFormatDetail(clickedReservation);
  });
  showFormatDetail(filteredReservations[0], false);

  const dimmedBackground = document.getElementById("dimmed-background");
  const popupDiv = document.getElementById("reservation-detail-popup");
  const closePopupButton = document.getElementById("close-popup");
  dimmedBackground.addEventListener("click", closePopup);
  popupDiv.addEventListener("click", (e) => e.stopPropagation());
  closePopupButton.addEventListener("click", closePopup);
};

fetchReservations().then((data) => {
  displayReservations(data.reservations);
});
