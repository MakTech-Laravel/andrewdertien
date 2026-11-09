import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { PondCard } from '@/components/pond/commerce';
import { PondShell } from '@/components/pond/ui';
import adminPonds from '@/routes/admin/ponds';

type EditablePond = PondCard & { ball_art: string; has_custom_image: boolean; is_published: boolean; show_on_frontend: boolean; sort_order: number };

type Props = {
    pond?: EditablePond;
    categories: { value: string; label: string }[];
    artwork: Record<string, string>;
    defaultArtwork: string;
    currency: string;
};

function FieldError({ message }: { message?: string }) {
    return message ? <p className="pd-field-error">{message}</p> : null;
}

export default function AdminPondForm({ pond, categories, artwork, defaultArtwork, currency }: Props) {
    const [customImageUrl, setCustomImageUrl] = useState<string | null>(pond?.has_custom_image ? pond.image_url : null);
    const uploadedPreview = useRef<string | null>(null);

    const form = useForm({
        name: pond?.name ?? '',
        tagline: pond?.tagline ?? '',
        description: pond?.description ?? '',
        category: pond?.category ?? categories[0].value,
        price: pond ? (pond.price_cents / 100).toFixed(2) : '',
        ball_art: pond?.ball_art ?? defaultArtwork,
        image: null as File | null,
        remove_image: false as boolean,
        is_published: pond?.is_published ?? true,
        show_on_frontend: pond?.show_on_frontend ?? true,
        sort_order: pond?.sort_order ?? 0,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(pond ? adminPonds.update(pond.id) : adminPonds.store(), { forceFormData: true, preserveScroll: 'errors' });
    };

    const title = pond ? `Edit ${pond.name}` : 'New pond';

    useEffect(() => {
        return () => {
            if (uploadedPreview.current) {
                URL.revokeObjectURL(uploadedPreview.current);
            }
        };
    }, []);

    const showPreview = (url: string | null) => {
        if (uploadedPreview.current) {
            URL.revokeObjectURL(uploadedPreview.current);
        }

        uploadedPreview.current = url?.startsWith('blob:') ? url : null;
        setCustomImageUrl(url);
    };

    const uploadImage = (file: File | undefined) => {
        if (!file) {
            return;
        }

        form.setData((data) => ({ ...data, image: file, remove_image: false }));
        showPreview(URL.createObjectURL(file));
    };

    /** Choosing a ball replaces any uploaded picture, which is removed on save. */
    const chooseBall = (key: string) => {
        form.setData((data) => ({ ...data, ball_art: key, image: null, remove_image: pond?.has_custom_image ?? false }));
        showPreview(null);
    };

    return (
        <>
            <Head title={title} />
            <PondShell
                page={title}
                subheading="Members see exactly what you write here."
                demo={false}
                action={
                    <Link href={adminPonds.index()} className="pond-btn pond-btn-outline-dark">
                        <ArrowLeft size={16} /> All ponds
                    </Link>
                }
            >
                <form onSubmit={submit} className="pd-form-grid">
                    <section className="pond-panel">
                        <div className="pond-panel-header">
                            <h2>Details</h2>
                        </div>

                        <label className="pond-form-label">
                            Name
                            <input className="pond-input" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} maxLength={120} required />
                            <FieldError message={form.errors.name} />
                        </label>

                        <label className="pond-form-label">
                            Tagline
                            <input className="pond-input" value={form.data.tagline} onChange={(event) => form.setData('tagline', event.target.value)} maxLength={160} placeholder="One short line shown on the card" />
                            <FieldError message={form.errors.tagline} />
                        </label>

                        <label className="pond-form-label">
                            Description
                            <textarea className="pond-textarea" rows={5} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} maxLength={2000} />
                            <FieldError message={form.errors.description} />
                        </label>

                        <div className="pond-form-two">
                            <label className="pond-form-label">
                                Category
                                <select className="pond-input" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)}>
                                    {categories.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={form.errors.category} />
                            </label>

                            <label className="pond-form-label">
                                Price ({currency.toUpperCase()})
                                <input className="pond-input" type="number" inputMode="decimal" min="0.50" max="1000000" step="0.01" value={form.data.price} onChange={(event) => form.setData('price', event.target.value)} required />
                                <FieldError message={form.errors.price} />
                            </label>
                        </div>

                        <fieldset className="pd-ball-picker">
                            <legend>Pond picture</legend>
                            <p className="pd-hint">Choose a golf ball or a marble, or upload your own image (up to 4 MB).</p>
                            <div>
                                {customImageUrl ? (
                                    <div className="pd-ball-custom is-selected">
                                        <img src={customImageUrl} alt="Uploaded pond" />
                                        <button type="button" onClick={() => chooseBall(form.data.ball_art)} aria-label="Remove uploaded image">
                                            <X size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="pd-ball-upload">
                                        <ImagePlus size={18} />
                                        <span>Upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            aria-label="Upload your own image"
                                            onChange={(event) => {
                                                uploadImage(event.target.files?.[0]);
                                                event.target.value = '';
                                            }}
                                        />
                                    </label>
                                )}
                                {Object.entries(artwork).map(([key, url]) => {
                                    const isSelected = !customImageUrl && form.data.ball_art === key;

                                    return (
                                        <button type="button" key={key} className={`pd-ball-option ${isSelected ? 'is-selected' : ''}`} onClick={() => chooseBall(key)} aria-pressed={isSelected} aria-label={key.replace('-', ' ')}>
                                            <img src={url} alt="" />
                                        </button>
                                    );
                                })}
                            </div>
                            <FieldError message={form.errors.ball_art} />
                            <FieldError message={form.errors.image} />
                        </fieldset>
                    </section>

                    <div className="pond-col-stack">
                        <section className="pond-panel">
                            <div className="pond-panel-header">
                                <h2>Where it appears</h2>
                            </div>
                            <label className="pd-check">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_published}
                                    onChange={(event) => {
                                        form.setData((data) => ({ ...data, is_published: event.target.checked, show_on_frontend: event.target.checked && data.show_on_frontend }));
                                    }}
                                />
                                <span>
                                    <strong>Offer to members</strong>
                                    <small>Members can choose and buy it from their dashboard.</small>
                                </span>
                            </label>
                            <label className="pd-check">
                                <input
                                    type="checkbox"
                                    checked={form.data.show_on_frontend}
                                    onChange={(event) => {
                                        form.setData((data) => ({ ...data, show_on_frontend: event.target.checked, is_published: event.target.checked || data.is_published }));
                                    }}
                                />
                                <span>
                                    <strong>Show on the website</strong>
                                    <small>Anyone can see it on the public home and ponds pages.</small>
                                </span>
                            </label>
                            <label className="pond-form-label">
                                Display order
                                <input className="pond-input" type="number" min="0" value={form.data.sort_order} onChange={(event) => form.setData('sort_order', Number(event.target.value))} />
                                <small className="pd-hint">Lower numbers appear first.</small>
                                <FieldError message={form.errors.sort_order} />
                            </label>
                        </section>

                        <button type="submit" className="pond-btn pond-btn-primary pond-wide" disabled={form.processing}>
                            <Check size={17} /> {form.processing ? 'Saving...' : pond ? 'Save changes' : 'Create pond'}
                        </button>
                    </div>
                </form>
            </PondShell>
        </>
    );
}
