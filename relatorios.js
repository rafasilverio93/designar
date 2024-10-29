const API_DESIGNACOES_URL = 'http://localhost:3000/designacoes';

// Selecionando elementos do DOM
const relatoriosTable = document.getElementById('relatorios-table').querySelector('tbody');
const filtroTerritorio = document.getElementById('filtro-territorio');
const filtroSaidaCampo = document.getElementById('filtro-saida-campo');
const dataInicialInput = document.getElementById('data-inicial');
const dataFinalInput = document.getElementById('data-final');

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
// Função para carregar territórios
async function carregarTerritorios() {
    try {
        const response = await fetch('http://localhost:3000/territorios');
        const territorios = await response.json();
        territorios.forEach(territorio => {
            const option = document.createElement('option');
            option.value = territorio.id;
            option.textContent = territorio.nome;
            filtroTerritorio.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar territórios:', error);
    }
}

// Função para carregar saídas de campo
async function carregarSaidasCampo() {
    try {
        const response = await fetch('http://localhost:3000/saidas_campo');
        const saidasCampo = await response.json();
        saidasCampo.forEach(saida => {
            const option = document.createElement('option');
            option.value = saida.id;
            option.textContent = saida.nome;
            filtroSaidaCampo.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar saídas de campo:', error);
    }
}

// Carregar dados iniciais
window.onload = () => {
    carregarTerritorios();
    carregarSaidasCampo();
    setarDatasPadrao();
    carregarRelatorios();
};

// Função para carregar designações
async function carregarRelatorios() {
    try {
        const response = await fetch(API_DESIGNACOES_URL);
        const designacoes = await response.json();
        renderTable(designacoes);
    } catch (error) {
        console.error('Erro ao carregar designações:', error);
    }
}

// Função para renderizar a tabela
function renderTable(data) {
    relatoriosTable.innerHTML = '';
    if (data.length === 0) {
        relatoriosTable.innerHTML = '<tr><td colspan="4">Nenhuma designação encontrada.</td></tr>';
        return;
    }

    data.forEach(designacao => {
        const row = `
            <tr>
                <td>${designacao.territorio_nome || 'Não informado'}</td>
                <td>${designacao.saida_nome || 'Não informado'}</td>
                <td>${formatarDataBR(designacao.data_designacao || '')}</td>
                <td>${formatarDataBR(designacao.data_devolucao || '')}</td>
            </tr>
        `;
        relatoriosTable.innerHTML += row;
    });
}

// Função para aplicar filtros avançados
document.getElementById('filtrar-btn').addEventListener('click', async () => {
    const territorios = Array.from(filtroTerritorio.selectedOptions).map(opt => opt.value);
    const saidasCampo = Array.from(filtroSaidaCampo.selectedOptions).map(opt => opt.value);
    const dataInicial = dataInicialInput.value;
    const dataFinal = dataFinalInput.value;

    let url = `${API_DESIGNACOES_URL}?`;
    if (territorios.length > 0) url += `territorios=${territorios.join(',')}&`;
    if (saidasCampo.length > 0) url += `saidas=${saidasCampo.join(',')}&`;
    if (dataInicial) url += `dataInicial=${dataInicial}&`;
    if (dataFinal) url += `dataFinal=${dataFinal}`;

    try {
        const response = await fetch(url);
        const designacoes = await response.json();
        renderTable(designacoes);
    } catch (error) {
        console.error('Erro ao filtrar designações:', error);
    }
});

// Exportar para PDF
document.getElementById('exportar-pdf-btn').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();
    doc.text('Relatório de Designações', 20, 20);

    // Cabeçalho
    doc.text('Território | Saída de Campo | Data de Designação | Data de Devolução', 10, 40);

    // Adicionando dados das linhas
    let y = 50;
    document.querySelectorAll("#relatorios-table tbody tr").forEach(row => {
        const cells = Array.from(row.querySelectorAll("td")).map(cell => cell.textContent);
        doc.text(cells.join(' | '), 10, y);
        y += 10;
    });

    // Baixar o PDF
    doc.save('relatorio_designacoes.pdf');
});


// Exportar para Excel (versão compatível com navegador)
document.getElementById('exportar-excel-btn').addEventListener('click', () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    // Cabeçalho
    worksheet.addRow(['Território', 'Saída de Campo', 'Data de Designação', 'Data de Devolução']);

    // Adicionando dados das linhas
    document.querySelectorAll("#relatorios-table tbody tr").forEach(row => {
        const rowData = Array.from(row.querySelectorAll("td")).map(cell => cell.textContent);
        worksheet.addRow(rowData);
    });

// Criar o arquivo Excel
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'relatorio_designacoes.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
    }).catch(error => {
        console.error('Erro ao exportar para Excel:', error);
    });
});

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