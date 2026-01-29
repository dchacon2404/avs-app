// Seleccionamos elementos del modal
const modal = document.getElementById('product-modal');
const modalImg = document.getElementById('modal-img');
const modalName = document.getElementById('modal-name');
const modalPrice = document.getElementById('modal-price');
const modalEstado = document.getElementById('modal-estado');
const closeBtn = document.querySelector('.close');

// Abrir modal al hacer click en cada producto
document.querySelectorAll('.product-card').forEach((card, index) => {
  card.addEventListener('click', () => {
    modal.style.display = 'block';
    modalImg.src = productos[index].imagen;
    modalName.textContent = productos[index].nombre;
    modalPrice.textContent = productos[index].precio;
    modalEstado.textContent = productos[index].estado;
  });
});

// Cerrar modal
closeBtn.onclick = function() {
  modal.style.display = 'none';
}

// Cerrar modal si se hace click afuera
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}
