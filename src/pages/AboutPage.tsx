import { NavLink } from "react-router-dom";
import { type FormEvent, useState } from "react";
import { sendFeedback } from "@/lib/feedbackApi";

const FEEDBACK_LAST_SENT_KEY = "imusic_feedback_last_sent_ms";
const FEEDBACK_COOLDOWN_MS = 60_000;

export function AboutPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-spam field
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (website.trim()) {
      // Bot filled hidden field.
      setStatus("Сообщение отправлено. Спасибо!");
      return;
    }

    const lastSent = Number(localStorage.getItem(FEEDBACK_LAST_SENT_KEY) ?? "0");
    const now = Date.now();
    if (Number.isFinite(lastSent) && now - lastSent < FEEDBACK_COOLDOWN_MS) {
      const sec = Math.ceil((FEEDBACK_COOLDOWN_MS - (now - lastSent)) / 1000);
      setStatus(`Слишком часто. Попробуйте снова через ${sec} сек.`);
      return;
    }

    setSubmitting(true);
    try {
      const ok = await sendFeedback({ name, contact, message });
      if (ok) {
        localStorage.setItem(FEEDBACK_LAST_SENT_KEY, String(Date.now()));
        setStatus("Сообщение отправлено. Спасибо!");
        setName("");
        setContact("");
        setMessage("");
        setWebsite("");
      } else {
        setStatus("Не удалось отправить сообщение. Проверьте поля и попробуйте снова.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <div className="ios-list overflow-hidden rounded-xl dark:bg-neutral-900">
        <div className="ios-list-header">О нас</div>
        <div className="space-y-3 bg-white p-4 text-[13px] font-semibold leading-relaxed text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <p>
            iMusic — это твой портал к музыке без ограничений. Мы создали этот
            веб-плеер, чтобы вы могли бесплатно слушать зарубежные релизы и
            треки без цензуры, которые пропали с официальных площадок.
          </p>
          <p>
            Мы вдохновлялись дизайном ранней iPhone OS, чтобы вернуть ту самую
            ламповую атмосферу 2010-х.
          </p>
          <p>
            Сейчас мы находимся на стадии бета-тестирования. Главные фичи уже в
            строю, но впереди еще много работы!
          </p>
          <p>
            🤝 Поддержать автора:
            <br />
            Проект бесплатный и живет за счет пожертвований. Будем благодарны
            за любую финансовую поддержку — она поможет нам расширить медиатеку
            и сделать сайт быстрее.
            <br />💳 Номер карты: 2200152974997549
          </p>
          <p>
            ✉️ Обратная связь:
            <br />
            Хотите, чтобы мы добавили конкретный трек? Нашли баг? Есть идеи по
            улучшению сайта? Пишите в форму ниже! Мы внимательно читаем каждое
            сообщение.
          </p>

          <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              aria-hidden
            />
            <input
              className="inset-field"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="inset-field"
              placeholder="Контакты (почта или Telegram)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <textarea
              className="inset-field min-h-28 resize-y"
              placeholder="Ваше сообщение: идея, баг или трек"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {status ? (
              <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                {status}
              </p>
            ) : null}
            <button
              type="submit"
              className="glossy-btn glossy-btn--primary"
              disabled={submitting}
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </form>

          <NavLink to="/" className="glossy-btn inline-block !no-underline">
            ← На главную
          </NavLink>
        </div>
      </div>
    </main>
  );
}
