'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitOrganizationQuoteRequest } from '@/lib/actions/quote';
import { APP_NAME } from '@/lib/constants';
import type { OrganizationIndustry } from '@/types/database';

export function RequestQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitOrganizationQuoteRequest(formData);

    if (result.error) {
      setMessage(result.error);
    } else {
      setIsSuccess(true);
      setMessage(result.message ?? 'Request submitted.');
      e.currentTarget.reset();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
        <input
          name="full_name"
          type="text"
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input
          name="company_name"
          type="text"
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <select
          name="industry"
          defaultValue="other"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="software">Software company</option>
          <option value="healthcare">Healthcare</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Team size (optional)</label>
        <input
          name="team_size"
          type="text"
          placeholder="e.g. 25 consultants, 3 departments"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What are you trying to solve? (optional)</label>
        <textarea
          name="message"
          rows={4}
          placeholder="Multi-tenant access, PHI safeguards, admin controls, etc."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {message && (
        <p className={`text-sm ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Request a quote'}
      </button>
    </form>
  );
}

export function RequestQuotePageContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white">
            ← Back to sign in
          </Link>
          <h1 className="text-3xl font-bold leading-tight mt-8 mb-4">
            Organization accounts for teams that need control
          </h1>
          <p className="text-gray-400 text-lg">
            Shared tenants, admin roles, access approvals, and healthcare PHI safeguards — priced for software and health systems, not self-serve free signup.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          <p className="font-medium text-white">{APP_NAME} Enterprise</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Admin-managed team access</li>
            <li>Organization-scoped projects and audit trail</li>
            <li>PHI redaction for healthcare uploads</li>
            <li>Custom onboarding and security review</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/login" className="lg:hidden text-sm text-gray-500 hover:text-gray-900">
            ← Back to sign in
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Request a quote</h2>
          <p className="text-sm text-gray-500 mb-8">
            Tell us about your organization. We&apos;ll follow up with pricing and setup — organization accounts are not free self-serve signup.
          </p>
          <RequestQuoteForm />
          <p className="text-sm text-gray-500 mt-6 text-center">
            Just need a personal workspace?{' '}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
