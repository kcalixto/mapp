const MULTIPLIERS = {
  "bus-round": 5.3 * 2,       // 10.60
  "bus-train-round": 9.38 * 2, // 18.76
  "train-oneway": 5.4,         // 5.40
};

function calculateTotal() {
  let total = 0;

  for (const [id, multiplier] of Object.entries(MULTIPLIERS)) {
    const inputValue = document.getElementById(id).value;
    const quantity = parseInt(inputValue) || 0;
    total += quantity * multiplier;
  }

  document.getElementById("total-result").textContent = total.toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" }
  );
}

Object.keys(MULTIPLIERS).forEach((id) => {
  document.getElementById(id).addEventListener("input", calculateTotal);
});
