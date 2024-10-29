const API_URL = 'http://localhost:3000/territorios';

// Selecionando elementos do DOM
const territorioInput = document.getElementById('territorio');
const enderecoInput = document.getElementById('endereco-nao-bater');
const addBtn = document.getElementById('add-btn');
const updateBtn = document.getElementById('update-btn');
const territoriosTable = document.getElementById('territorios-table').querySelector('tbody');
const feedbackMessage = document.getElementById('feedback-message');

let territorios = [];
let editId = null;

// Carregar territórios ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetchTerritorios();
});

// Função para buscar territórios
async function fetchTerritorios() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        territorios = await response.json();
        renderTable();
    } catch (error) {
        exibirMensagem(`Erro ao carregar territórios: ${error.message}`, 'error');
    }
}

// Validação em tempo real
function validarFormulario() {
    const nomeValido = territorioInput.value.trim() !== '';
    addBtn.disabled = !nomeValido;
    updateBtn.disabled = !nomeValido || editId === null;
}

territorioInput.addEventListener('input', validarFormulario);
enderecoInput.addEventListener('input', validarFormulario);

// Função para exibir mensagens de feedback
function exibirMensagem(mensagem, tipo) {
    feedbackMessage.textContent = mensagem;
    feedbackMessage.className = `feedback-message ${tipo}`;
    feedbackMessage.style.display = 'block';
    setTimeout(() => feedbackMessage.style.display = 'none', 3000);
}

// Função para renderizar a tabela
function renderTable() {
    territoriosTable.innerHTML = '';
    territorios.forEach((territorio) => {
        const row = `
            <tr>
                <td>${territorio.nome}</td>
                <td>${territorio.endereco_nao_bater || 'Não informado'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTerritorio(${territorio.id})">Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteTerritorio(${territorio.id})">Excluir</button>
                </td>
            </tr>
        `;
        territoriosTable.innerHTML += row;
    });
}

// Funções para adicionar, atualizar e excluir territórios
addBtn.addEventListener('click', async () => {
    const nome = territorioInput.value.trim();
    const endereco = enderecoInput.value.trim();

    if (!nome) {
        exibirMensagem('O nome do território é obrigatório!', 'error');
        return;
    }

    const nomeDuplicado = territorios.some(t => t.nome.toLowerCase() === nome.toLowerCase());
    if (nomeDuplicado) {
        exibirMensagem('O nome do território já existe!', 'error');
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, endereco_nao_bater: endereco })
        });
        exibirMensagem('Território adicionado com sucesso!', 'success');
        resetForm();
        fetchTerritorios();
    } catch (error) {
        exibirMensagem(`Erro ao adicionar território: ${error.message}`, 'error');
    }
});

updateBtn.addEventListener('click', async () => {
    const nome = territorioInput.value.trim();
    const endereco = enderecoInput.value.trim();

    if (!nome || editId === null) {
        exibirMensagem('Preencha o nome do território antes de atualizar!', 'error');
        return;
    }

    const nomeDuplicado = territorios.some(t => t.nome.toLowerCase() === nome.toLowerCase() && t.id !== editId);
    if (nomeDuplicado) {
        exibirMensagem('O nome do território já existe!', 'error');
        return;
    }

    try {
        await fetch(`${API_URL}/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, endereco_nao_bater: endereco })
        });
        exibirMensagem('Território atualizado com sucesso!', 'success');
        resetForm();
        fetchTerritorios();
    } catch (error) {
        exibirMensagem(`Erro ao atualizar território: ${error.message}`, 'error');
    }
});

function editTerritorio(id) {
    const territorio = territorios.find((t) => t.id === id);
    editId = id;
    territorioInput.value = territorio.nome;
    enderecoInput.value = territorio.endereco_nao_bater;
    addBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';
    validarFormulario();
}

async function deleteTerritorio(id) {
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        exibirMensagem('Território excluído com sucesso!', 'success');
        fetchTerritorios();
    } catch (error) {
        exibirMensagem(`Erro ao excluir território: ${error.message}`, 'error');
    }
}

// Função para resetar o formulário
function resetForm() {
    territorioInput.value = '';
    enderecoInput.value = '';
    addBtn.style.display = 'inline-block';
    updateBtn.style.display = 'none';
    editId = null;
    validarFormulario();
}

// Alternar o menu de navegação em dispositivos móveis
document.getElementById('menu-toggle').addEventListener('click', () => {
    const navbarLinks = document.getElementById('navbar-links');
    navbarLinks.classList.toggle('show');
});
