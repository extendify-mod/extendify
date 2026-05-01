const e = document.createElement("style");
e.innerText = `{{style}}`;
document.addEventListener("DOMContentLoaded", () =>
	document.body.appendChild(e),
);
