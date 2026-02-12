'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { submitContactForm } from '@/app/actions/contact'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const result = await submitContactForm(data)
      if (result.success) {
        toast.success('Message Sent!', {
          description: "We'll get back to you as soon as possible.",
        })
        form.reset()
      } else {
        toast.error('Failed to send', {
          description: result.error,
        })
      }
    } catch {
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-[#F4F3EE] min-h-screen py-24">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-stone-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Have a question, feedback, or partnership inquiry? We'd love to hear from you.
            </p>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column: Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-3xl font-bold text-stone-900 mb-4">
                  Let's start a conversation.
                </h2>
                <p className="text-stone-600 leading-relaxed">
                  Whether you're a student needing lab access or a university looking to partner, we're here.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-1">Email</p>
                    <a
                      href="mailto:info@innozverse.com"
                      className="text-xl font-medium text-stone-900 hover:text-orange-600 transition-colors"
                    >
                      info@innozverse.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-1">HQ</p>
                    <p className="text-lg font-medium text-stone-900">
                      2 W Main St, Frostburg, MD 21532
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3070.8!2d-78.9284!3d39.6581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89ca7f0d4e4b1b1d%3A0x1c0d0d0d0d0d0d0d!2s2%20W%20Main%20St%2C%20Frostburg%2C%20MD%2021532!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="innoZverse HQ Location"
                />
              </div>
            </div>

            {/* Right Column: Form */}
            <div>
              <div className="bg-white rounded-xl shadow-sm p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="What's this about?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="General">General Inquiry</SelectItem>
                              <SelectItem value="Support">Support</SelectItem>
                              <SelectItem value="Partnership">Partnership</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us how we can help..."
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      size="lg"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
