const API_TERRITORIOS_URL = 'http://localhost:3000/territorios';
const API_SAIDAS_CAMPO_URL = 'http://localhost:3000/saidas_campo';
const API_DESIGNACOES_URL = 'http://localhost:3000/designacoes';

// Selecionando elementos do DOM
const territorioSelect = document.getElementById('territorio-select');
const saidaCampoSelect = document.getElementById('saida-campo-select');
const dataDesignacaoInput = document.getElementById('data-designacao');
const dataDevolucaoInput = document.getElementById('data-devolucao');
const addBtn = document.getElementById('add-btn');
const updateBtn = document.getElementById('update-btn');
const designacoesTable = document.getElementById('designacoes-table').querySelector('tbody');

let designacoes = [];
let editId = null;
let colunaOrdenacao = '';
let ordemAtual = 'asc';

// Função para obter a data atual no formato ISO (yyyy-mm-dd)
function obterDataAtualISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para obter a data 22 dias após a data atual no formato ISO
function obterDataDevolucaoISO() {
    const data = new Date();
    data.setDate(data.getDate() + 20);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Carregar dados iniciais ao iniciar
window.onload = () => {
    carregarTerritorios();
    carregarSaidasCampo();
    carregarDesignacoes();
    setarDatasPadrao();

    // Adicionar evento de clique para ordenação nos cabeçalhos das colunas
    const headers = document.querySelectorAll('#designacoes-table th[data-column]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const coluna = header.getAttribute('data-column');
            const ordem = header.getAttribute('data-order');

            // Alternar a ordem de ordenação
            ordemAtual = ordem === 'asc' ? 'desc' : 'asc';
            header.setAttribute('data-order', ordemAtual);

            // Chamar a função para ordenar a tabela
            ordenarTabela(coluna, ordemAtual);
        });
    });
};

// Função para ordenar a tabela de designações
function ordenarTabela(coluna, ordem) {
    designacoes.sort((a, b) => {
        let valorA = a[coluna] || '';
        let valorB = b[coluna] || '';

        // Para ordenar corretamente as datas
        if (coluna.includes('data')) {
            valorA = new Date(valorA);
            valorB = new Date(valorB);
        } else {
            valorA = valorA.toString().toLowerCase();
            valorB = valorB.toString().toLowerCase();
        }

        if (ordem === 'asc') {
            return valorA > valorB ? 1 : -1;
        } else {
            return valorA < valorB ? 1 : -1;
        }
    });

    // Atualizar a tabela com a nova ordenação
    renderTable();
}

// Função para carregar territórios no select
async function carregarTerritorios() {
    try {
        const response = await fetch(API_TERRITORIOS_URL);
        if (!response.ok) throw new Error('Erro ao buscar territórios');

        const territorios = await response.json();
        territorioSelect.innerHTML = '<option value="" disabled selected>Selecione o Território</option>';
        territorios.forEach((territorio) => {
            const option = document.createElement('option');
            option.value = territorio.id;
            option.textContent = territorio.nome;
            territorioSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar territórios:', error);
    }
}

// Função para carregar saídas de campo no select
async function carregarSaidasCampo() {
    try {
        const response = await fetch(API_SAIDAS_CAMPO_URL);
        if (!response.ok) throw new Error('Erro ao buscar saídas de campo');

        const saidasCampo = await response.json();
        saidaCampoSelect.innerHTML = '<option value="" disabled selected>Selecione a Saída de Campo</option>';
        saidasCampo.forEach((saida) => {
            const option = document.createElement('option');
            option.value = saida.id;
            option.textContent = saida.nome;
            saidaCampoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar saídas de campo:', error);
    }
}

// Função para buscar as designações do banco de dados
async function carregarDesignacoes() {
    try {
        const response = await fetch(API_DESIGNACOES_URL);
        if (!response.ok) throw new Error('Erro ao buscar designações');

        designacoes = await response.json();
        renderTable();
    } catch (error) {
        console.error('Erro ao carregar designações:', error);
    }
}

// Função para definir as datas padrão nos campos de seleção de data
function setarDatasPadrao() {
    dataDesignacaoInput.value = obterDataAtualISO();
    dataDevolucaoInput.value = obterDataDevolucaoISO();
}

// Função para formatar a data para o formato brasileiro (dd/mm/yyyy)
function formatarDataBR(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar a data para o formato ISO (yyyy-mm-dd)
function formatarDataISO(data) {
    if (!data) return '';
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
}

// Função para renderizar a tabela de designações
function renderTable() {
    designacoesTable.innerHTML = '';
    designacoes.forEach((designacao) => {
        const row = `
            <tr>
                <td>${designacao.territorio_nome}</td>
                <td>${designacao.endereco_nao_bater || 'Não informado'}</td>
                <td>${designacao.saida_nome}</td>
                <td>${formatarDataBR(designacao.data_designacao)}</td>
                <td>${formatarDataBR(designacao.data_devolucao)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editDesignacao(${designacao.id})">Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteDesignacao(${designacao.id})">Excluir</button>
                </td>
            </tr>
        `;
        designacoesTable.innerHTML += row;
    });
}

// Validação em tempo real para o campo 'territorio-select'
territorioSelect.addEventListener('change', () => {
    if (territorioSelect.value === '') {
        territorioSelect.classList.add('error');
    } else {
        territorioSelect.classList.remove('error');
    }
});

// Validação em tempo real para o campo 'saida-campo-select'
saidaCampoSelect.addEventListener('change', () => {
    if (saidaCampoSelect.value === '') {
        saidaCampoSelect.classList.add('error');
    } else {
        saidaCampoSelect.classList.remove('error');
    }
});

// Validação em tempo real para o campo 'data-designacao'
dataDesignacaoInput.addEventListener('input', () => {
    if (dataDesignacaoInput.value === '') {
        dataDesignacaoInput.classList.add('error');
    } else {
        dataDesignacaoInput.classList.remove('error');
    }
});

// Validação em tempo real para o campo 'data-devolucao'
dataDevolucaoInput.addEventListener('input', () => {
    if (dataDevolucaoInput.value === '') {
        dataDevolucaoInput.classList.add('error');
    } else {
        dataDevolucaoInput.classList.remove('error');
    }
});

// Função para adicionar uma designação com validação
addBtn.addEventListener('click', async () => {
    const territorioId = territorioSelect.value;
    const saidaCampoId = saidaCampoSelect.value;
    const dataDesignacao = dataDesignacaoInput.value;
    const dataDevolucao = dataDevolucaoInput.value;

    if (!territorioId) {
        territorioSelect.classList.add('error');
        alert('O território é obrigatório!');
        return;
    }

    if (!saidaCampoId) {
        saidaCampoSelect.classList.add('error');
        alert('A saída de campo é obrigatória!');
        return;
    }

    if (!dataDesignacao) {
        dataDesignacaoInput.classList.add('error');
        alert('A data de designação é obrigatória!');
        return;
    }

    if (!dataDevolucao) {
        dataDevolucaoInput.classList.add('error');
        alert('A data de devolução é obrigatória!');
        return;
    }

    // Código para adicionar designação (sem alterações)
    try {
        await fetch(API_DESIGNACOES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ territorioId, saidaCampoId, dataDesignacao, dataDevolucao })
        });
        resetForm();
        carregarDesignacoes();
    } catch (error) {
        console.error('Erro ao adicionar designação:', error);
    }
});

// Função para editar uma designação
function editDesignacao(id) {
    const designacao = designacoes.find((d) => d.id === id);
    editId = id;
    territorioSelect.value = designacao.territorio_id;
    saidaCampoSelect.value = designacao.saida_id;
    dataDesignacaoInput.value = designacao.data_designacao;
    dataDevolucaoInput.value = designacao.data_devolucao;
    addBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';
}

// Função para atualizar uma designação
updateBtn.addEventListener('click', async () => {
    const territorioId = territorioSelect.value;
    const saidaCampoId = saidaCampoSelect.value;
    const dataDesignacao = dataDesignacaoInput.value;
    const dataDevolucao = dataDevolucaoInput.value;

    if (territorioId && saidaCampoId && dataDesignacao && dataDevolucao && editId !== null) {
        try {
            await fetch(`${API_DESIGNACOES_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ territorioId, saidaCampoId, dataDesignacao, dataDevolucao })
            });
            resetForm();
            carregarDesignacoes();
        } catch (error) {
            console.error('Erro ao atualizar designação:', error);
        }
    }
});

// Função para excluir uma designação
async function deleteDesignacao(id) {
    try {
        await fetch(`${API_DESIGNACOES_URL}/${id}`, { method: 'DELETE' });
        carregarDesignacoes();
    } catch (error) {
        console.error('Erro ao excluir designação:', error);
    }
}

// Função para resetar o formulário
function resetForm() {
    territorioSelect.value = '';
    saidaCampoSelect.value = '';
    dataDesignacaoInput.value = '';
    dataDevolucaoInput.value = '';
    addBtn.style.display = 'inline-block';
    updateBtn.style.display = 'none';
    editId = null;
}
