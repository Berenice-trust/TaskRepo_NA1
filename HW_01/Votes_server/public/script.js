document.addEventListener("DOMContentLoaded", () => {
    loadVariants();
    loadResults();

    //События нажатия на кнопки
    document.getElementById("download-json-btn").addEventListener("click", 
        () => downloadResults('json'));
    
    document.getElementById("download-html-btn").addEventListener("click", 
        () => downloadResults('html'));
    
    document.getElementById("download-xml-btn").addEventListener("click", 
        () => downloadResults('xml'));
});

//Варианты с сервера
async function loadVariants() {
    try {
        const responce = await fetch("/variants");
        const variants = await responce.json();
        const variantsContainer = document.getElementById("variants-container");

        variantsContainer.innerHTML = "<h2>Варианты</h2>"; //очистка контейнера

        //Кнопки для голосования
        variants.forEach(variant => {
            const button = document.createElement("button");
            button.textContent = variant.text;
            button.onclick = () => vote(variant.id);
            variantsContainer.appendChild(button);
        });
    } catch (error) {
        console.error("Error loading variants:", error);
    }
}

//Отправка голоса на сервер
async function vote(id) {
    try{
        const response = await fetch("/vote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        const result = await response.json();

        if (result.success) {
            loadResults(); //обновляем результаты
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error("Error voting:", error);
    }
}

//Получение статистики с сервера
async function loadResults() {
    try {
        const response = await fetch("/stat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const stats = await response.json(); // Переименуйте result в stats

        const statsContainer = document.getElementById("stats");
        statsContainer.innerHTML = ""; //очистка контейнера

        // Получение вариантов ответов
        const variantsResponse = await fetch('/variants');
        const variants = await variantsResponse.json();
        
        // Создание элементов для каждого варианта со статистикой
        Object.keys(stats).forEach(id => {
            const variant = variants.find(v => v.id.toString() === id);
            if (variant) {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                statItem.textContent = `${variant.text}: ${stats[id]} голосов`;
                statsContainer.appendChild(statItem);
            }
        });
    } catch (error) {
        console.error('Error with get stats:', error);
    }
}

// Функция для скачивания файла
function downloadBlob(data, fileName) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data]));
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

//функция для скачивания в разных форматах
async function downloadResults(formatType) {
    const format = {
        json: { accept: "application/json", filename: "results.json" },
        html: { accept: "text/html", filename: "results.html" },
        xml: { accept: "application/xml", filename: "results.xml" },
    };

    try {
        const response = await fetch("/download", {
            headers: { 'Accept': format[formatType].accept }
        });
        const data = await response.text();
        downloadBlob(data, format[formatType].filename);
    } catch (error) {
        console.error("Ошибка загрузки результатов:", error);
    }
}