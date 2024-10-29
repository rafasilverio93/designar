const API_URL = 'http://localhost:3000/saidas_campo';

// Selecionando elementos do DOM
const saidaCampoInput = document.getElementById('saida-campo');
const diaSemanaSelect = document.getElementById('dia-semana');
const addBtn = document.getElementById('add-btn');
const updateBtn = document.getElementById('update-btn');
const saidasCampoTable = document.getElementById('saidas-campo-table').querySelector('tbody');

let saidasCampo = [];
let editId = null;

// Carregar saídas de campo ao iniciar
window.onload = () => {
    fetchSaidasCampo();
};

// Validação de campos e duplicidade
function validarCampos() {
    let isValid = true;

    if (!saidaCampoInput.value.trim()) {
        saidaCampoInput.setCustomValidity('O nome é obrigatório.');
        saidaCampoInput.reportValidity();
        isValid = false;
    } else {
        saidaCampoInput.setCustomValidity('');
    }

    if (!diaSemanaSelect.value) {
        diaSemanaSelect.setCustomValidity('Selecione um dia da semana.');
        diaSemanaSelect.reportValidity();
        isValid = false;
    } else {
        diaSemanaSelect.setCustomValidity('');
    }

    return isValid;
}

function verificarDuplicidade(nome, diaSemana) {
    return saidasCampo.some(saida => saida.nome === nome && saida.dia_semana === diaSemana);
}

// Função para buscar saídas de campo do banco de dados
async function fetchSaidasCampo() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        saidasCampo = await response.json();
        renderTable();
    } catch (error) {
        console.error('Erro ao buscar saídas de campo:', error);
        alert('Erro ao carregar saídas de campo. Tente novamente mais tarde.');
    } finally {
        showLoading(false);
    }
}

// Validação em tempo real para o campo 'saida-campo'
saidaCampoInput.addEventListener('input', () => {
    if (saidaCampoInput.value.trim() === '') {
        saidaCampoInput.classList.add('error');
    } else {
        saidaCampoInput.classList.remove('error');
    }
});

// Validação em tempo real para o campo 'dia-semana'
diaSemanaSelect.addEventListener('change', () => {
    if (diaSemanaSelect.value === '') {
        diaSemanaSelect.classList.add('error');
    } else {
        diaSemanaSelect.classList.remove('error');
    }
});

// Função genérica para adicionar ou atualizar uma saída de campo
async function enviarSaidaCampo(method, url, body) {
    showLoading(true);
    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        resetForm();
        fetchSaidasCampo();
    } catch (error) {
        console.error(`Erro ao ${method === 'POST' ? 'adicionar' : 'atualizar'} saída de campo:`, error);
        alert('Erro ao processar a saída de campo. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

// Evento de clique para adicionar uma saída de campo
addBtn.addEventListener('click', async () => {
    if (!validarCampos()) return;

    const nome = saidaCampoInput.value.trim();
    const diaSemana = diaSemanaSelect.value;

    if (verificarDuplicidade(nome, diaSemana)) {
        alert('Já existe uma saída de campo com o mesmo nome e dia da semana.');
        return;
    }

    await enviarSaidaCampo('POST', API_URL, { nome, dia_semana: diaSemana });
});

// Função para renderizar a tabela
function renderTable() {
    saidasCampoTable.innerHTML = '';
    if (saidasCampo.length === 0) {
        saidasCampoTable.innerHTML = '<tr><td colspan="3">Nenhuma saída de campo encontrada.</td></tr>';
        return;
    }

    saidasCampo.forEach((saida) => {
        const row = `
            <tr>
                <td>${saida.nome}</td>
                <td>${saida.dia_semana}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editSaidaCampo(${saida.id})">Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteSaidaCampo(${saida.id})">Excluir</button>
                </td>
            </tr>
        `;
        saidasCampoTable.innerHTML += row;
    });
}

// Função para editar uma saída de campo
function editSaidaCampo(id) {
    const saida = saidasCampo.find((s) => s.id === id);
    editId = id;
    saidaCampoInput.value = saida.nome;
    diaSemanaSelect.value = saida.dia_semana;
    addBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';
}

// Evento de clique para atualizar uma saída de campo
updateBtn.addEventListener('click', async () => {
    if (!validarCampos()) return;

    const nome = saidaCampoInput.value.trim();
    const diaSemana = diaSemanaSelect.value;

    if (verificarDuplicidade(nome, diaSemana)) {
        alert('Já existe uma saída de campo com o mesmo nome e dia da semana.');
        return;
    }

    if (editId !== null) {
        await enviarSaidaCampo('PUT', `${API_URL}/${editId}`, { nome, dia_semana: diaSemana });
    }
});

// Função para excluir uma saída de campo
async function deleteSaidaCampo(id) {
    if (!confirm('Tem certeza que deseja excluir esta saída de campo?')) return;

    await enviarSaidaCampo('DELETE', `${API_URL}/${id}`, null);
}

// Função para resetar o formulário
function resetForm() {
    saidaCampoInput.value = '';
    diaSemanaSelect.value = '';
    addBtn.style.display = 'inline-block';
    updateBtn.style.display = 'none';
    editId = null;
}

// Alternar o menu de navegação em dispositivos móveis
document.getElementById('menu-toggle').addEventListener('click', () => {
    const navbarLinks = document.getElementById('navbar-links');
    navbarLinks.classList.toggle('show');
});

function showLoading(isLoading) {
    document.getElementById('loading-spinner').style.display = isLoading ? 'block' : 'none';
}
