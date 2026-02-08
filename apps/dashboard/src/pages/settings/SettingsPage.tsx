/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useRestaurant,
  useUpdateRestaurant,
  useOperatingHours,
  useUpdateOperatingHours,
} from '../../lib/api/restaurant';
import ImageUpload from '../../components/media/ImageUpload';

type TabType = 'general' | 'hours' | 'branding';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// General settings form schema
const generalFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string(),
  description: z.string().max(1000).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  dineInEnabled: z.boolean(),
  prepTimeMinutes: z.number().int().min(0).max(300),
  acceptingOrders: z.boolean(),
});

// Helper to convert empty strings to undefined for API submission
function cleanFormData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  Object.keys(data).forEach((key) => {
    const value = data[key];
    cleaned[key] = value === '' ? undefined : value;
  });
  return cleaned as Partial<T>;
}

type GeneralFormData = z.infer<typeof generalFormSchema>;

// Hours form schema
const hoursFormSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number(),
      isClosed: z.boolean(),
      openTime: z.string(),
      closeTime: z.string(),
    })
  ),
});

type HoursFormData = z.infer<typeof hoursFormSchema>;

// Branding form schema
const brandingFormSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  customCss: z.string().max(10000).optional(),
});

type BrandingFormData = z.infer<typeof brandingFormSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const { data: restaurant, isLoading: isLoadingRestaurant } = useRestaurant();
  const { data: operatingHours, isLoading: isLoadingHours } = useOperatingHours();
  const updateRestaurant = useUpdateRestaurant();
  const updateHours = useUpdateOperatingHours();

  // General form
  const generalForm = useForm<GeneralFormData>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      pickupEnabled: true,
      deliveryEnabled: false,
      dineInEnabled: false,
      prepTimeMinutes: 20,
      acceptingOrders: true,
    },
  });

  // Hours form
  const hoursForm = useForm<HoursFormData>({
    resolver: zodResolver(hoursFormSchema),
    defaultValues: {
      hours: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false,
        openTime: '09:00',
        closeTime: '22:00',
      })),
    },
  });

  // Branding form
  const brandingForm = useForm<BrandingFormData>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      brandColor: '#000000',
      logoUrl: '',
      coverImageUrl: '',
      customCss: '',
    },
  });

  // Populate general form
  useEffect(() => {
    if (restaurant) {
      generalForm.reset({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        addressLine1: restaurant.addressLine1 || '',
        addressLine2: restaurant.addressLine2 || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        postalCode: restaurant.postalCode || '',
        country: restaurant.country || 'US',
        pickupEnabled: restaurant.pickupEnabled,
        deliveryEnabled: restaurant.deliveryEnabled,
        dineInEnabled: restaurant.dineInEnabled,
        prepTimeMinutes: restaurant.prepTimeMinutes,
        acceptingOrders: restaurant.acceptingOrders,
      });

      brandingForm.reset({
        brandColor: restaurant.brandColor,
        logoUrl: restaurant.logoUrl || '',
        coverImageUrl: restaurant.coverImageUrl || '',
        customCss: restaurant.customCss || '',
      });
    }
  }, [restaurant, generalForm, brandingForm]);

  // Populate hours form
  useEffect(() => {
    if (operatingHours && operatingHours.length > 0) {
      hoursForm.reset({
        hours: Array.from({ length: 7 }, (_, dayOfWeek) => {
          const existingHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
          return existingHours
            ? {
                dayOfWeek: existingHours.dayOfWeek,
                isClosed: existingHours.isClosed,
                openTime: existingHours.openTime,
                closeTime: existingHours.closeTime,
              }
            : {
                dayOfWeek,
                isClosed: false,
                openTime: '09:00',
                closeTime: '22:00',
              };
        }),
      });
    }
  }, [operatingHours, hoursForm]);

  const onSubmitGeneral = async (data: GeneralFormData) => {
    await updateRestaurant.mutateAsync(cleanFormData({
      name: data.name,
      description: data.description,
      email: data.email,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      pickupEnabled: data.pickupEnabled,
      deliveryEnabled: data.deliveryEnabled,
      dineInEnabled: data.dineInEnabled,
      prepTimeMinutes: data.prepTimeMinutes,
      acceptingOrders: data.acceptingOrders,
    }));
  };

  const onSubmitHours = async (data: HoursFormData) => {
    await updateHours.mutateAsync(data.hours);
  };

  const onSubmitBranding = async (data: BrandingFormData) => {
    await updateRestaurant.mutateAsync(cleanFormData({
      brandColor: data.brandColor,
      logoUrl: data.logoUrl,
      coverImageUrl: data.coverImageUrl,
      customCss: data.customCss,
    }));
  };

  if (isLoadingRestaurant || isLoadingHours) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your restaurant information, hours, and branding
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-2" aria-label="Settings tabs">
          <button
            onClick={() => setActiveTab('general')}
            className={
              activeTab === 'general'
                ? 'px-6 py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={
              activeTab === 'hours'
                ? 'px-6 py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          >
            Hours
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={
              activeTab === 'branding'
                ? 'px-6 py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          >
            Branding
          </button>
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              {/* Name */}
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name <span className="text-red-600">*</span>
                </label>
                <input
                  {...generalForm.register('name')}
                  id="name"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Joe's Pizza"
                />
                {generalForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* Slug (read-only) */}
              <div className="mb-6">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <div className="relative">
                  <input
                    {...generalForm.register('slug')}
                    id="slug"
                    type="text"
                    disabled
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">This is used in your storefront URL and cannot be changed</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...generalForm.register('description')}
                  id="description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell customers about your restaurant..."
                />
                {generalForm.formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    {...generalForm.register('email')}
                    id="email"
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@restaurant.com"
                  />
                  {generalForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    {...generalForm.register('phone')}
                    id="phone"
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                  {generalForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>

              {/* Address Line 1 */}
              <div className="mb-6">
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  {...generalForm.register('addressLine1')}
                  id="addressLine1"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St"
                />
              </div>

              {/* Address Line 2 */}
              <div className="mb-6">
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  {...generalForm.register('addressLine2')}
                  id="addressLine2"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    {...generalForm.register('city')}
                    id="city"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State / Province
                  </label>
                  <input
                    {...generalForm.register('state')}
                    id="state"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="NY"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    {...generalForm.register('postalCode')}
                    id="postalCode"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            {/* Fulfillment Options */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fulfillment Options</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    {...generalForm.register('pickupEnabled')}
                    id="pickupEnabled"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="pickupEnabled" className="text-sm font-medium text-gray-700">
                    Enable Pickup Orders
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    {...generalForm.register('deliveryEnabled')}
                    id="deliveryEnabled"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="deliveryEnabled" className="text-sm font-medium text-gray-700">
                    Enable Delivery Orders
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    {...generalForm.register('dineInEnabled')}
                    id="dineInEnabled"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="dineInEnabled" className="text-sm font-medium text-gray-700">
                    Enable Dine-In Orders
                  </label>
                </div>
              </div>
            </div>

            {/* Operations */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Operations</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prep Time */}
                <div>
                  <label htmlFor="prepTimeMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Default Prep Time (minutes)
                  </label>
                  <input
                    {...generalForm.register('prepTimeMinutes', { valueAsNumber: true })}
                    id="prepTimeMinutes"
                    type="number"
                    min="0"
                    max="300"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-600">Estimated time to prepare an order</p>
                </div>

                {/* Accepting Orders */}
                <div>
                  <label htmlFor="acceptingOrders" className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      {...generalForm.register('acceptingOrders')}
                      id="acceptingOrders"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="acceptingOrders" className="text-sm font-medium text-gray-700">
                      Currently Accepting Orders
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Disable to pause all online ordering</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generalForm.formState.isSubmitting}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {generalForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <form onSubmit={hoursForm.handleSubmit(onSubmitHours)} className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
            <p className="text-sm text-gray-600 mb-6">
              Times are in your restaurant's timezone. Leave a day closed if you don't operate that day.
            </p>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const isClosed = hoursForm.watch(`hours.${index}.isClosed`);

                return (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    {/* Day label */}
                    <div className="w-32 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">{day}</span>
                    </div>

                    {/* Closed checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        {...hoursForm.register(`hours.${index}.isClosed`)}
                        id={`closed-${index}`}
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor={`closed-${index}`} className="text-sm text-gray-700">
                        Closed
                      </label>
                    </div>

                    {/* Time inputs */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <label htmlFor={`open-${index}`} className="block text-xs text-gray-600 mb-1">
                          Open
                        </label>
                        <input
                          {...hoursForm.register(`hours.${index}.openTime`)}
                          id={`open-${index}`}
                          type="time"
                          disabled={isClosed}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                      </div>

                      <span className="text-gray-400 pt-5">→</span>

                      <div className="flex-1">
                        <label htmlFor={`close-${index}`} className="block text-xs text-gray-600 mb-1">
                          Close
                        </label>
                        <input
                          {...hoursForm.register(`hours.${index}.closeTime`)}
                          id={`close-${index}`}
                          type="time"
                          disabled={isClosed}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={hoursForm.formState.isSubmitting}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {hoursForm.formState.isSubmitting ? 'Saving...' : 'Save Hours'}
            </button>
          </div>
        </form>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <form onSubmit={brandingForm.handleSubmit(onSubmitBranding)} className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Brand Color */}
            <div>
              <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-2">
                Brand Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  {...brandingForm.register('brandColor')}
                  id="brandColor"
                  type="color"
                  className="w-16 h-16 border-2 border-gray-300 rounded-md cursor-pointer"
                />
                <div>
                  <input
                    {...brandingForm.register('brandColor')}
                    type="text"
                    placeholder="#000000"
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-600">Used for buttons, links, and accents in your storefront</p>
                </div>
              </div>
              {brandingForm.formState.errors.brandColor && (
                <p className="mt-1 text-sm text-red-600">{brandingForm.formState.errors.brandColor.message}</p>
              )}
            </div>

            {/* Logo */}
            <div className="pt-6 border-t border-gray-200">
              <ImageUpload
                value={brandingForm.watch('logoUrl') || null}
                onChange={(url) => brandingForm.setValue('logoUrl', url)}
                aspectRatio="square"
                label="Restaurant Logo"
                helperText="Square image works best. Will be displayed in your storefront header."
              />
            </div>

            {/* Cover Image */}
            <div className="pt-6 border-t border-gray-200">
              <ImageUpload
                value={brandingForm.watch('coverImageUrl') || null}
                onChange={(url) => brandingForm.setValue('coverImageUrl', url)}
                aspectRatio="16:9"
                label="Cover Image"
                helperText="Wide landscape image for your storefront hero section."
              />
            </div>

            {/* Custom CSS */}
            <div className="pt-6 border-t border-gray-200">
              <label htmlFor="customCss" className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                {...brandingForm.register('customCss')}
                id="customCss"
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="/* Your custom CSS here */"
              />
              <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Advanced users only</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Invalid CSS may break your storefront. Test thoroughly before saving.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={brandingForm.formState.isSubmitting}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {brandingForm.formState.isSubmitting ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
