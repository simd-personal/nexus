function joinKeywords(values: string[] | null | undefined): string {
  return (values ?? []).join(', ');
}

interface RelevanceProfileFieldsProps {
  companyName: string | null;
  nameAliases: string[];
  watchKeywords: string[];
}

export function RelevanceProfileFields({
  companyName,
  nameAliases,
  watchKeywords,
}: RelevanceProfileFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company
        </label>
        <input
          name="company_name"
          defaultValue={companyName ?? ''}
          placeholder="UpperDeck"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name aliases
        </label>
        <input
          name="name_aliases"
          defaultValue={joinKeywords(nameAliases)}
          placeholder="Sim, Simpson"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Comma-separated nicknames or alternate spellings Sunny should match in transcripts.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Account keywords
        </label>
        <input
          name="watch_keywords"
          defaultValue={joinKeywords(watchKeywords)}
          placeholder="UpperDeck, portfolio lead"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Terms that should trigger action items when they appear with a follow-up for you.
        </p>
      </div>
    </>
  );
}
