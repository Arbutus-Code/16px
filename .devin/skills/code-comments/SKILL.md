---
name: code-comments
description: Document code intent, not implementation. Comment complex logic, algorithms, and non-obvious functionality only. Remove obvious comments. Use language-specific docstrings.
license: Arbutus Code - MIT License
---

## Principles

- **Document WHY, not WHAT**: Explain intent, not visible functionality
- **Comment complexity only**: Algorithms, business rules, workarounds, security, performance rationale
- **Use docstrings**: Prefer runtime-accessible documentation
- **Remove noise**: Delete obvious, outdated, or repetitive comments

## Language Standards

### Python (Google Style)

```python
def calculate_rolling_average(data_points: list[float], window_size: int = 10) -> float:
    """Calculate exponentially weighted rolling average over a sliding window.

    Uses exponential decay to weight recent data points more heavily,
    providing better responsiveness to trends than a simple moving average.

    Args:
        data_points: List of numeric values to average
        window_size: Number of most recent points to include in calculation

    Returns:
        Weighted average as a float

    Raises:
        ValueError: If fewer data points than minimum window size
    """
    # Apply exponential decay: recent points weighted more heavily
    recent = data_points[-window_size:]
    if len(recent) < 5:
        raise ValueError(f"Need at least 5 data points, got {len(recent)}")

    decay_factor = 0.9  # Each step back loses 10% weight
    weighted_sum = 0.0
    total_weight = 0.0

    for i, value in enumerate(recent):
        point_weight = decay_factor ** (len(recent) - 1 - i)
        weighted_sum += value * point_weight
        total_weight += point_weight

    return weighted_sum / total_weight
```

### TypeScript/JavaScript (JSDoc)

```typescript
/**
 * Sanitizes markdown content for safe DOM insertion.
 *
 * Uses DOMPurify to remove XSS vectors while preserving markdown formatting.
 *
 * @param content - Raw markdown string to process
 * @returns Sanitized HTML string safe for DOM insertion
 * @throws {Error} When markdown parsing fails or content is invalid
 */
export function processMarkdown(content: string): string {
  if (!content || typeof content !== "string") {
    throw new Error("Invalid content: must be non-empty string");
  }

  const html = marked(content);
  return DOMPurify.sanitize(html);
}
```

### SQL

```sql
-- Calculate engagement scores with recency-weighted scoring and tier normalization
WITH weighted_activity AS (
  SELECT
    user_id,
    -- Apply exponential decay: recent events weighted more heavily
    SUM(event_score * POWER(0.9, days_ago)) / SUM(POWER(0.9, days_ago)) AS weighted_avg,
    -- Tier-specific normalization factor
    CASE
      WHEN account_tier = 'premium' THEN 1.2
      WHEN account_tier IN ('enterprise', 'team') THEN 1.1
      ELSE 1.0
    END AS tier_multiplier
  FROM user_events
  WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, account_tier
)
SELECT
  u.user_id,
  u.email,
  ROUND(wa.weighted_avg * wa.tier_multiplier, 3) AS engagement_score
FROM weighted_activity wa
JOIN users u ON wa.user_id = u.user_id;
```

### CSS

```css
/* Content styling using design system custom properties */
.prose {
  --tw-prose-body: var(--color-text-muted);
  --tw-prose-headings: var(--color-text);
  --tw-prose-bold: var(--color-primary);
  line-height: 1.75;
  font-size: 1rem;
}

/* Prevent code blocks from breaking layout on small screens */
.prose pre {
  overflow-x: auto;
  max-width: 100%;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.875em;
}
```

### YAML Configuration

```yaml
# Volume mounts are critical for data persistence
services:
  api:
    # Changed from read-only to allow dynamic config changes
    volumes:
      - ${APP_DIR}/config:/app/config:rw

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Checklist

- [ ] No obvious comments (`x = 5 // Set x to 5`)
- [ ] Complex algorithms, business rules, security, and performance documented
- [ ] API contracts use docstrings with params/returns/throws
- [ ] Comments updated when code changes
