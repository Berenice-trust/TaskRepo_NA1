document.addEventListener("DOMContentLoaded", () => {
    loadVariants();
    loadResults();
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
