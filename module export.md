1. В файле today.js вводится конструкци
   ```js
   	module.exports = async (tp) => {
   		const today = tp.date.now("YYYY-MM-DD");
   		return `Сегодня: ${today}`;
   	};
   ```
2. В шаблоне
   Дата: <%\* await tp.user.today(tp) %> --- выполняет код без вывода
   Дата: <% await tp.user.today(tp) %> --- выполняет код и вставляет результат


3. Передача параметров
3.1 Несколько параметров
```
	module.exports = async (tp, a, b, c) => {
		return `a=${a}, b=${b}, c=${c}`;
	};
```
```
	<%* await tp.user.myFunc(tp, 10, "текст", true) %>
```
a=10, 
b=текст, 
c=true

3.2 Параметры с значениями по умолчанию
```
module.exports = async (tp, city = "Алматы", unit = "C") => {
    return `Город: ${city}, единицы: ${unit}`;
};
```
```
<%* await tp.user.myFunc(tp) %>
<%* await tp.user.myFunc(tp, "Астана") %>
```

3.3 Передача объекта
```
module.exports = async (tp, options = {}) => {
    const {
        city = "Алматы",
        lang = "ru",
        units = "metric"
    } = options;

    return `${city}, ${lang}, ${units}`;
};
```
```
<%* await tp.user.myFunc(tp, {
    city: "Караганда",
    lang: "ru",
    units: "metric"
}) %>
```

3.4 Передача массива
```
module.exports = async (tp, days) => {
    return days.join(", ");
};
```
```
<%* await tp.user.myFunc(tp, ["Пн", "Вт", "Ср"]) %>
```

