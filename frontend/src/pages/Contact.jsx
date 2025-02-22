import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Title from '../components/Title';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapse } from 'react-collapse';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Contact = () => {
  const [formData, setFormData] = useState({
    to_name: 'Admin',
    from_name: '',
    user_email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    emailjs.init("pXgCM9mdmOzowFIDq");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const templateParams = {
        to_name: formData.to_name,
        from_name: formData.from_name,
        message: `Subject: ${formData.subject}\n\nMessage: ${formData.message}\n\nFrom Email: ${formData.user_email}`,
      };

      await emailjs.send(
        "service_hfvbwt3",
        "template_6d78ynr",
        templateParams
      );

      setShowSuccess(true);
      
      // Reset form
      setFormData({
        to_name: 'Admin',
        from_name: '',
        user_email: '',
        subject: '',
        message: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('EmailJS Error:', error);
      alert('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const togglePanel = (index) => {
    setActivePanel(activePanel === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Title text1="CONTACT" text2="US" />
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg">
            We'd love to hear from you. Have a question? Let us know!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card className="p-8 shadow-xl">
            <CardContent>
              <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
              {showSuccess && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Success!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your message has been sent successfully. We'll get back to you soon.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    name="from_name"
                    placeholder="Your Name"
                    value={formData.from_name}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                  <Input
                    name="user_email"
                    type="email"
                    placeholder="Your Email"
                    value={formData.user_email}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>
                <Input
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
                <Textarea
                  name="message"
                  placeholder="Try to be clear and concise"
                  value={formData.message}
                  onChange={handleChange}
                  className="h-32 resize-none"
                  required
                />
                <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info Panels */}
          <div className="space-y-6">
            {[
              {
                icon: <MapPin className="h-6 w-6 text-blue-500" />,
                title: 'Visit Us',
                details: ['54709 Willms Station', 'Suite 350, Washington, USA'],
              },
              {
                icon: <Phone className="h-6 w-6 text-green-500" />,
                title: 'Call Us',
                details: ['(415) 555-0132', 'Mon-Fri, 9:00 AM - 6:00 PM'],
              },
              {
                icon: <Mail className="h-6 w-6 text-purple-500" />,
                title: 'Email Us',
                details: ['admin@forever.com', 'support@forever.com'],
              },
              {
                icon: <Clock className="h-6 w-6 text-orange-500" />,
                title: 'Business Hours',
                details: [
                  'Monday - Friday: 9:00 AM - 6:00 PM',
                  'Saturday: 10:00 AM - 4:00 PM',
                  'Sunday: Closed',
                ],
              },
            ].map((item, index) => (
              <Card key={index} className="shadow-xl">
                <CardContent className="p-6">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => togglePanel(index)}
                  >
                    <div className="flex items-center space-x-4">
                      {item.icon}
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        activePanel === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <Collapse isOpened={activePanel === index}>
                    <div className="mt-4 text-gray-600 space-y-2">
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-base">{detail}</p>
                      ))}
                    </div>
                  </Collapse>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="rounded-xl overflow-hidden shadow-xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.2891732781397!2d-122.3316413!3d47.6087226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDM2JzMxLjQiTiAxMjLCsDIwJzA2LjQiVw!5e0!3m2!1sen!2sus!4v1635768159185!5m2!1sen!2sus"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;