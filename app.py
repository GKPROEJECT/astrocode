from datetime import datetime
import random

class Usuario:
    def __init__(self, nombre, email):
        self.nombre = nombre
        self.email = email
        self.fecha_registro = datetime.now()

    def __str__(self):
        return f"{self.nombre} <{self.email}>"

def generar_usuarios():
    nombres = ["Ana", "Carlos", "Lucía", "Miguel", "Sofía"]
    dominios = ["gmail.com", "hotmail.com", "example.com"]

    usuarios = []

    for i in range(5):
        nombre = random.choice(nombres)
        email = f"{nombre.lower()}{i}@{random.choice(dominios)}"
        usuario = Usuario(nombre, email)
        usuarios.append(usuario)

    return usuarios


# Ejecutar ejemplo
usuarios = generar_usuarios()

print("📋 Lista de usuarios generados:\n")

for u in usuarios:
    print(u)