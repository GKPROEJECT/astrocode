import html2canvas from "html2canvas";

async function capturarElemento() {
  const elemento = document.getElementById("miCodigo");

  const canvas = await html2canvas(elemento);

  const imagen = canvas.toDataURL("image/png");

  // descargar imagen
  const link = document.createElement("a");
  link.href = imagen;
  link.download = "captura.png";
  link.click();
}