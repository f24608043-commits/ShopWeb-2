import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { globalFormSchema } from '@/lib/validations/global-form';

// GET /api/global-forms - Fetch all global forms with their options and values
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: globalForms, error } = await supabase
      .from('global_forms')
      .select(`
        *,
        options:product_options(
          *,
          values:product_option_values(*)
        ),
        products:products(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch global forms' }, { status: 500 });
    }

    return NextResponse.json(globalForms);
  } catch (error) {
    console.error('GET /api/global-forms error:', error);
    return NextResponse.json({ error: 'Failed to fetch global forms' }, { status: 500 });
  }
}

// POST /api/global-forms - Admin creation of global reusable form
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = await createClient();
    const body = await req.json();
    const validatedData = globalFormSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, description, active, options } = validatedData.data;

    // Create Global Form
    const { data: newGlobalForm, error: insertError } = await supabase
      .from('global_forms')
      .insert({ name, description, active })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create global form' }, { status: 500 });
    }

    // Create options and values
    if (options && options.length > 0) {
      for (const opt of options) {
        const { data: newOption, error: optionError } = await supabase
          .from('product_options')
          .insert({
            name: opt.name,
            input_type: opt.inputType,
            global_form_id: newGlobalForm.id,
          })
          .select()
          .single();

        if (optionError) {
          console.error('Failed to create option:', optionError);
          continue;
        }

        // Create option values
        if (opt.values && opt.values.length > 0) {
          const valueInserts = opt.values.map((val) => ({
            value: val.value,
            price_adjustment: val.priceAdjustment,
            option_id: newOption.id,
          }));

          const { error: valuesError } = await supabase
            .from('product_option_values')
            .insert(valueInserts);

          if (valuesError) {
            console.error('Failed to create option values:', valuesError);
          }
        }
      }
    }

    // Fetch complete form with options
    const { data: completeForm } = await supabase
      .from('global_forms')
      .select(`
        *,
        options:product_options(
          *,
          values:product_option_values(*)
        )
      `)
      .eq('id', newGlobalForm.id)
      .single();

    return NextResponse.json(completeForm, { status: 201 });
  } catch (error) {
    console.error('POST /api/global-forms error:', error);
    return NextResponse.json({ error: 'Failed to create global form' }, { status: 500 });
  }
}
